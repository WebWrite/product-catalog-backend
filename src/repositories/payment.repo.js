import Payment from "../models/Payment.js"

class PaymentRepository {
  static findByOrderId(orderId) {
    return Payment.findOne({ orderId }).lean()
  }

  static findBySessionId(sessionId) {
    return Payment.findOne({ sessionId }).lean()
  }

  static createPayment(data, session) {
    return Payment.create([data], { session })
  }

  static updatePaymentBySessionId(sessionId, updates) {
    return Payment.findOneAndUpdate(
      { sessionId },
      { $set: updates },
      {
        new: true,
        runValidators: true
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
