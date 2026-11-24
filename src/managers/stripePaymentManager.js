import AppError from "../utils/AppError.js"
import { HTTP_STATUS } from "../constants/statusCodes.js"
import OrderRepository from "../repositories/order.repo.js"
import CartRepository from "../repositories/cart.repo.js"
import PaymentRepository from "../repositories/payment.repo.js"
import ActivityLog from "../models/AcitivtyLog.js"
import stripe from "../config/stripe.js"
import {
  SHIPPING_COST,
  getProductSize,
  generateRequestHash
} from "../utils/order.helper.js"
import mongoose from "mongoose"

class StripePaymentManager {
  static async createStripeCheckout(
    customerId,
    data,
    requestId,
    idempotencyKey
  ) {
    const requestHash = generateRequestHash(data)

    const existingOrder = await OrderRepository.findByIdempotencyKey(
      customerId,
      idempotencyKey
    )

    if (existingOrder) {
      if (existingOrder.requestHash !== requestHash) {
        throw new AppError(
          "Idempotency key already used with different checkout data.",
          HTTP_STATUS.CONFLICT
        )
      }

      const payment = await PaymentRepository.findByOrderId(existingOrder._id)

      if (!payment) {
        throw new AppError(
          "Payment record not found for existing order.",
          HTTP_STATUS.CONFLICT
        )
      }

      const checkoutSession = await stripe.checkout.sessions.retrieve(
        payment.sessionId
      )

      if (checkoutSession.status !== "open" || !checkoutSession.url) {
        throw new AppError(
          "Existing checkout session is no longer available.",
          HTTP_STATUS.CONFLICT
        )
      }

      return {
        orderId: existingOrder._id,
        checkoutUrl: checkoutSession.url,
        replayed: true
      }
    }
    const cart = await CartRepository.getCartForOrder(customerId)

    if (!cart?.items?.length) {
      throw new AppError("Your cart is empty.", HTTP_STATUS.BAD_REQUEST)
    }

    const products = await OrderRepository.findProductsForOrder(
      cart.items.map((item) => item.productId)
    )

    const items = cart.items.map((cartItem) => {
      const product = products.find(
        (item) => item._id.toString() === cartItem.productId.toString()
      )

      if (!product || product.status !== "active") {
        throw new AppError(
          "One or more products are unavailable.",
          HTTP_STATUS.BAD_REQUEST
        )
      }

      if (product.stock < cartItem.quantity) {
        throw new AppError(
          `Insufficient stock for ${product.name}.`,
          HTTP_STATUS.CONFLICT
        )
      }

      return {
        productId: product._id,
        sellerId: product.sellerId,
        name: product.name,
        price: product.price,
        quantity: cartItem.quantity,
        itemTotal: product.price * cartItem.quantity,
        size: getProductSize(product, cartItem.size),
        status: "pending"
      }
    })

    const subtotal = items.reduce((sum, item) => sum + item.itemTotal, 0)

    const total = subtotal + SHIPPING_COST

    const paymentExpiresAt = new Date(Date.now() + 30 * 60 * 1000)

    const [order] = await OrderRepository.createOrder({
      customerId,
      items,
      shippingAddress: {
        ...data.shippingAddress,
        phone: `+92${data.shippingAddress.phone}`
      },
      subtotal,
      shippingCost: SHIPPING_COST,
      total,
      paymentMethod: "STRIPE",
      paymentStatus: "pending",
      paymentExpiresAt,
      idempotencyKey,
      requestHash
    })

    const lineItems = items.map((item) => ({
      price_data: {
        currency: "pkr",
        product_data: { name: item.name },
        unit_amount: Math.round(item.price * 100)
      },
      quantity: item.quantity
    }))

    lineItems.push({
      price_data: {
        currency: "pkr",
        product_data: { name: "Delivery" },
        unit_amount: Math.round(SHIPPING_COST * 100)
      },
      quantity: 1
    })

    const checkoutSession = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        line_items: lineItems,
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
        success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_URL}/payment/cancelled`
      },
      {
        idempotencyKey: `checkout-create:${order._id}`
      }
    )

    await PaymentRepository.createPayment({
      orderId: order._id,
      provider: "stripe",
      sessionId: checkoutSession.id,
      amount: total,
      currency: "PKR",
      status: "pending",
      paymentExpiresAt
    })

    await ActivityLog.create({
      userId: customerId,
      action: "STRIPE_CHECKOUT_CREATED",
      target: "Payment",
      role: "customer",
      status: "success",
      message: "Customer created a Stripe checkout session",
      requestId,
      metadata: {
        orderId: order._id,
        sessionId: checkoutSession.id,
        paymentMethod: "STRIPE",
        total
      }
    })

    return {
      orderId: order._id,
      checkoutUrl: checkoutSession.url
    }
  }

  static async retryStripePayment(customerId, orderId, requestId) {
    if (!mongoose.isValidObjectId(orderId)) {
      throw new AppError("Invalid order ID.", HTTP_STATUS.BAD_REQUEST)
    }

    const order = await OrderRepository.findCustomerOrder(orderId, customerId)

    if (!order) {
      throw new AppError("Order not found.", HTTP_STATUS.NOT_FOUND)
    }

    const payment = await PaymentRepository.findByOrderId(order._id)

    if (!payment) {
      throw new AppError(
        "Payment record not found for this order.",
        HTTP_STATUS.NOT_FOUND
      )
    }
    if (
      ["refund_pending", "refund_failed", "refunded"].includes(payment?.status)
    ) {
      throw new AppError(
        "Payment cannot be retried because a refund is pending or has already been issued.",
        HTTP_STATUS.CONFLICT
      )
    }

    const allItemsPending =
      order.items.length > 0 &&
      order.items.every((item) => item.status === "pending")

    if (!allItemsPending) {
      throw new AppError(
        "Payment cannot be retried because some order items are no longer pending.",
        HTTP_STATUS.CONFLICT
      )
    }
    if (order.paymentMethod !== "STRIPE") {
      throw new AppError(
        "This order does not use Stripe.",
        HTTP_STATUS.BAD_REQUEST
      )
    }

    if (order.paymentStatus === "completed") {
      throw new AppError(
        "This order has already been paid.",
        HTTP_STATUS.CONFLICT
      )
    }

    if (order.paymentStatus !== "pending" && order.paymentStatus !== "failed") {
      throw new AppError(
        "Payment cannot be retried for this order.",
        HTTP_STATUS.CONFLICT
      )
    }

    if (payment.status === "pending" && payment.sessionId) {
      const existingSession = await stripe.checkout.sessions.retrieve(
        payment.sessionId
      )

      if (existingSession.status === "open" && existingSession.url) {
        return {
          orderId: order._id,
          checkoutUrl: existingSession.url
        }
      }
    }

    const lineItems = order.items.map((item) => ({
      price_data: {
        currency: "pkr",
        product_data: {
          name: item.name
        },
        unit_amount: Math.round(item.price * 100)
      },
      quantity: item.quantity
    }))
    lineItems.push({
      price_data: {
        currency: "pkr",
        product_data: {
          name: "Delivery"
        },
        unit_amount: Math.round(order.shippingCost * 100)
      },
      quantity: 1
    })

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment/cancelled`,
      metadata: {
        orderId: order._id.toString()
      }
    })

    const paymentExpiresAt = new Date(Date.now() + 30 * 60 * 1000)

    const updatedPayment = await PaymentRepository.updatePaymentByOrderId(
      order._id,
      {
        sessionId: checkoutSession.id,
        status: "pending",
        paymentExpiresAt
      }
    )

    if (!updatedPayment) {
      throw new AppError(
        "Payment record not found for this order.",
        HTTP_STATUS.NOT_FOUND
      )
    }

    const updatedOrder = await OrderRepository.updateOrderForPaymentRetry(
      order._id,
      paymentExpiresAt
    )

    if (!updatedOrder) {
      throw new AppError(
        "Unable to prepare order for payment retry.",
        HTTP_STATUS.CONFLICT
      )
    }

    await ActivityLog.create({
      userId: customerId,
      action: "STRIPE_PAYMENT_RETRY_CREATED",
      target: "Payment",
      role: "customer",
      status: "success",
      message: "Customer retried Stripe payment",
      requestId,
      metadata: {
        orderId: order._id,
        sessionId: checkoutSession.id
      }
    })

    return {
      orderId: order._id,
      checkoutUrl: checkoutSession.url
    }
  }
}

export default StripePaymentManager
