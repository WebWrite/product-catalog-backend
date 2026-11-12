import mongoose from "mongoose"

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true
    },

    provider: {
      type: String,
      enum: ["stripe"],
      required: true
    },

    sessionId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    currency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 3
    },
    paymentExpiresAt: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refund_pending", "refunded"],
      default: "pending",
      required: true
    }
  },
  {
    timestamps: true
  }
)

const Payment = mongoose.model("Payment", paymentSchema)
paymentSchema.index({ paymentExpiresAt: 1 }, { expireAfterSeconds: 0 })
export default Payment
