import Payment from "../models/Payment.js"

class PaymentRepository {
  static findByOrderId(orderId) {
    return Payment.findOne({ orderId }).lean()
  }

  static findBySessionId(sessionId, session) {
    return Payment.findOne({ sessionId })
      .session(session ?? null)
      .lean()
  }

  static createPayment(data, session) {
    return Payment.create([data], { session })
  }

  static updatePaymentBySessionId(sessionId, updates, session) {
    return Payment.findOneAndUpdate(
      { sessionId },
      {
        $set: updates,
        ...(["completed", "refund_pending", "refunded"].includes(
          updates.status
        ) && {
          $unset: { paymentExpiresAt: 1 }
        })
      },
      {
        returnDocument: "after",
        runValidators: true,
        session
      }
    )
  }

  static updatePaymentByOrderId(orderId, updates) {
    return Payment.findOneAndUpdate(
      { orderId },
      { $set: updates },
      {
        returnDocument: "after",
        runValidators: true
      }
    )
  }
  static markRefundPending(sessionId, paymentIntentId, session) {
    return Payment.findOneAndUpdate(
      { sessionId, status: "pending" },
      {
        $set: {
          status: "refund_pending",
          paymentIntentId
        },
        $unset: { paymentExpiresAt: 1 }
      },
      {
        returnDocument: "after",
        runValidators: true,
        session
      }
    )
  }

  static updateRefundDetails(paymentId, refund) {
    return Payment.findOneAndUpdate(
      {
        _id: paymentId,
        status: "refund_pending"
      },
      {
        $set: {
          refundId: refund.id,
          refundStatus: refund.status,
          refundFailureReason: refund.failure_reason ?? null,
          ...(refund.status === "succeeded" && {
            status: "refunded"
          })
        }
      },
      {
        returnDocument: "after",
        runValidators: true
      }
    )
  }
  static findById(paymentId) {
    return Payment.findById(paymentId).lean()
  }
}

export default PaymentRepository
