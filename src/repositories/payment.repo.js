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
      { sessionId, status: "pending" },
      { $set: updates },
      {
        new: true,
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
}

export default PaymentRepository
