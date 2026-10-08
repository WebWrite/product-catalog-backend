import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
    },

    provider: {
      type: String,
      enum: ["stripe"],
      required: true,
    },

    sessionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    paymentIntentId: {
      type: String,
      trim: true,
      default: null,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 3,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "completed",
        "failed",
        "unknown",
      ],
      default: "pending",
      required: true,
    },
  },
  {
    timestamps: true
  }
);

paymentSchema.index(
  { orderId: 1 },
  { unique: true }
);

paymentSchema.index(
  { sessionId: 1 },
  { unique: true }
);

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;