import PaymentRepository from "../repositories/payment.repo.js"
import OrderRepository from "../repositories/order.repo.js"
import stripe from "../config/stripe.js"

class RefundManager {
  static async processStripeRefund(paymentId) {
    const payment = await PaymentRepository.findById(paymentId)

    if (!payment) {
      throw new Error("Payment record not found.")
    }
    if (["refunded", "refund_failed"].includes(payment.status)) {
      return payment
    }

    if (payment.status !== "refund_pending") {
      throw new Error("Payment is not eligible for a refund.")
    }
    if (payment.refundId) {
      return payment
    }

    if (!payment.paymentIntentId) {
      throw new Error("PaymentIntent ID is missing.")
    }

    const refund = await stripe.refunds.create(
      {
        payment_intent: payment.paymentIntentId,
        reason: "requested_by_customer"
      },
      {
        idempotencyKey: `refund-${payment._id}`
      }
    )

    const updatedPayment = await PaymentRepository.updateRefundDetails(
      payment._id,
      refund
    )

    if (updatedPayment) {
      await OrderRepository.updateOrderRefundStatus(
        payment.orderId,
        updatedPayment.status
      )

      return updatedPayment
    }
    const latestPayment = await PaymentRepository.findById(paymentId)

    if (
      latestPayment &&
      (["refunded", "refund_failed"].includes(latestPayment.status) ||
        latestPayment.refundId === refund.id)
    ) {
      await OrderRepository.updateOrderRefundStatus(
        payment.orderId,
        latestPayment.status
      )
      return latestPayment
    }

    throw new Error("Unable to update payment refund details.")
  }

  static async handleStripeRefundWebhook(event) {
    const refund = event.data.object

    const payment = await PaymentRepository.updateRefundFromStripe(refund)

    if (!payment) {
      throw new Error(`Payment not found for Stripe refund: ${refund.id}`)
    }

    await OrderRepository.updateOrderRefundStatus(
      payment.orderId,
      payment.status
    )

    return payment
  }

  static isRetryableStripeError(error) {
    return (
      error.type === "StripeConnectionError" ||
      error.type === "StripeAPIError" ||
      error.type === "StripeRateLimitError" ||
      error.statusCode === 429 ||
      error.statusCode >= 500
    )
  }
}

export default RefundManager
