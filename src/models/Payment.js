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
    paymentIntentId: {
      type: String,
      default: null,
      index: true
    },
    refundId: {
      type: String,
      default: null
    },
    refundStatus: {
      type: String,
      enum: ["pending", "succeeded", "failed", "canceled"],
      default: null
    },
    refundFailureReason: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: [
        "pending",
        "completed",
        "failed",
        "refund_pending",
        "refund_failed",
        "refunded"
      ],
      default: "pending",
      required: true
    }
  },
  {
    timestamps: true
  }
)
paymentSchema.index({ paymentExpiresAt: 1 }, { expireAfterSeconds: 0 })

const Payment = mongoose.model("Payment", paymentSchema)
export default Payment
