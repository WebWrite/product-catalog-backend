import mongoose from "mongoose"
import AppError from "../utils/AppError.js"
import { HTTP_STATUS } from "../constants/statusCodes.js"
import OrderRepository from "../repositories/order.repo.js"
import CartRepository from "../repositories/cart.repo.js"
import PaymentRepository from "../repositories/payment.repo.js"
import ActivityLog from "../models/AcitivtyLog.js"
import stripe from "../config/stripe.js"
import refundQueue from "../queues/refundQueue.js"
import OrderStockManager from "./orderStockManager.js"
import RefundManager from "./refundManager.js"

class StripeWebhookManager {
  static async handleStripeWebhook(rawBody, signature, requestId) {
    let event

    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      )
    } catch {
      throw new AppError(
        "Invalid Stripe webhook signature.",
        HTTP_STATUS.BAD_REQUEST
      )
    }

    const refundEvents = ["refund.created", "refund.updated", "refund.failed"]

    if (refundEvents.includes(event.type)) {
      return RefundManager.handleStripeRefundWebhook(event)
    }
    const checkoutSession = event.data.object

    const isSuccess =
      event.type === "checkout.session.completed" &&
      checkoutSession.payment_status === "paid"

    const isFailed = [
      "checkout.session.async_payment_failed",
      "checkout.session.expired"
    ].includes(event.type)

    if (!isSuccess && !isFailed) return

    const dbSession = await mongoose.startSession()

    let payment
    let order
    let stockFailure = false
    let refundPaymentId = null
    try {
      try {
        await dbSession.withTransaction(async () => {
          stockFailure = false

          payment = await PaymentRepository.findBySessionId(
            checkoutSession.id,
            dbSession
          )

          if (!payment) return

          if (payment.status === "refund_pending") {
            refundPaymentId = payment._id
            return
          }

          if (payment.status !== "pending") return

          order = await OrderRepository.findOrderById(
            payment.orderId,
            dbSession
          )

          if (!order || order.paymentStatus !== "pending") return

          if (!order.items.every((item) => item.status === "pending")) return

          if (isFailed) {
            await PaymentRepository.updatePaymentBySessionId(
              checkoutSession.id,
              { status: "failed" },
              dbSession
            )

            await OrderRepository.updateOrderPaymentStatus(
              order._id,
              "failed",
              dbSession
            )

            await ActivityLog.create(
              [
                {
                  userId: order.customerId,
                  action: "STRIPE_PAYMENT_FAILED",
                  target: "Payment",
                  role: "customer",
                  status: "failure",
                  message: "Stripe payment failed or checkout expired",
                  requestId,
                  metadata: {
                    orderId: order._id,
                    paymentId: payment._id,
                    sessionId: checkoutSession.id,
                    stripeEventId: event.id,
                    eventType: event.type
                  }
                }
              ],
              { session: dbSession }
            )

            return
          }

          if (
            checkoutSession.amount_total !== Math.round(order.total * 100) ||
            checkoutSession.amount_total !== Math.round(payment.amount * 100) ||
            checkoutSession.currency?.toLowerCase() !==
              payment.currency.toLowerCase()
          ) {
            throw new AppError(
              "Invalid payment details.",
              HTTP_STATUS.BAD_REQUEST
            )
          }

          // Bulk stock decrement
          try {
            await OrderStockManager.decreaseStock(order.items, dbSession)
          } catch (error) {
            if (error.statusCode === HTTP_STATUS.CONFLICT) {
              stockFailure = true
            }

            throw error
          }

          // Prepare stock history
          await OrderStockManager.createStockHistory(order.items, dbSession)

          await OrderRepository.updateOrderPaymentStatus(
            order._id,
            "completed",
            dbSession
          )

          await PaymentRepository.updatePaymentBySessionId(
            checkoutSession.id,
            { status: "completed" },
            dbSession
          )

          const cart = await CartRepository.getCartForOrder(
            order.customerId,
            dbSession
          )

          const isCartUnchanged = (cartItems, orderItems) => {
            if (cartItems.length !== orderItems.length) return false

            return cartItems.every((cartItem) =>
              orderItems.some(
                (orderItem) =>
                  orderItem.productId.toString() ===
                    cartItem.productId.toString() &&
                  orderItem.quantity === cartItem.quantity
              )
            )
          }

          if (cart?.items?.length && isCartUnchanged(cart.items, order.items)) {
            await CartRepository.clearCartForOrder(order.customerId, dbSession)
          }
          await ActivityLog.create(
            [
              {
                userId: order.customerId,
                action: "STRIPE_PAYMENT_COMPLETED",
                target: "Payment",
                role: "customer",
                status: "success",
                message: "Stripe payment completed successfully",
                requestId,
                metadata: {
                  orderId: order._id,
                  paymentId: payment._id,
                  sessionId: checkoutSession.id,
                  stripeEventId: event.id,
                  amount: payment.amount,
                  currency: payment.currency
                }
              }
            ],
            { session: dbSession }
          )
        })
      } catch (error) {
        if (!stockFailure) throw error

        const paymentIntentId = checkoutSession.payment_intent

        if (!paymentIntentId) {
          throw new Error(
            "PaymentIntent ID is missing for a paid Checkout Session.",
            {
              cause: error
            }
          )
        }
        const refundSession = await mongoose.startSession()

        try {
          await refundSession.withTransaction(async () => {
            const updatedPayment = await PaymentRepository.markRefundPending(
              checkoutSession.id,
              paymentIntentId,
              refundSession
            )

            const updatedOrder = await OrderRepository.markOrderRefundPending(
              order._id,
              refundSession
            )
            if (!updatedPayment || !updatedOrder) {
              throw new Error("Unable to persist refund-required state.", {
                cause: error
              })
            }
            await ActivityLog.create(
              [
                {
                  userId: order.customerId,
                  action: "STRIPE_REFUND_REQUIRED",
                  target: "Payment",
                  role: "customer",
                  status: "failure",
                  message:
                    "Stripe payment succeeded but stock was unavailable. Refund required.",
                  requestId,
                  metadata: {
                    orderId: order._id,
                    paymentId: payment._id,
                    sessionId: checkoutSession.id,
                    paymentIntentId,
                    stripeEventId: event.id
                  }
                }
              ],
              { session: refundSession }
            )
          })
        } finally {
          await refundSession.endSession()
        }
        refundPaymentId = payment._id
      }
    } finally {
      await dbSession.endSession()
    }
    if (refundPaymentId) {
      try {
        await RefundManager.processStripeRefund(refundPaymentId)
      } catch (error) {
        if (RefundManager.isRetryableStripeError(error)) {
          await refundQueue.add(
            "process-refund",
            { paymentId: refundPaymentId.toString() },
            { jobId: `refund-${refundPaymentId}` }
          )
          console.error(
            "Immediate refund failed. Added retry job:",
            error.message
          )
        } else {
          throw error
        }
      }
    }
  }
}

export default StripeWebhookManager
