import mongoose from "mongoose";

const emailVerificationSchema = new mongoose.Schema(
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
    timestamps: true
  }
);

emailVerificationSchema.index(
  { userId: 1 },
  { unique: true }
);

const EmailVerification = mongoose.model( "EmailVerification", emailVerificationSchema);

export default EmailVerification;