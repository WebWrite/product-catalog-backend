import mongoose from "mongoose";

const loginOtpSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    codeHash: {
      type: String,
      required: true,
      select: false,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  }
);

loginOtpSchema.index({ userId: 1 }, { unique: true });

const LoginOtp = mongoose.model("LoginOtp", loginOtpSchema);

export default LoginOtp;