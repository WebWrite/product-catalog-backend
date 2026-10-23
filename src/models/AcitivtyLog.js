import mongoose from "mongoose"

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    action: {
      type: String,
      required: true,
      trim: true
    },
    target: {
      type: String,
      required: true,
      trim: true
    },
    role: {
      type: String,
      enum: ["customer", "seller", "admin"],
      required: true
    },
    status: {
      type: String,
      enum: ["success", "failure"],
      required: true
    },
    message: {
      type: String,
      required: true,
      maxlength: 300
    },

    requestId: {
      type: String,
      trim: true
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined
    }
  },
  {
    timestamps: true
  }
)

activityLogSchema.index({ userId: 1, createdAt: -1 })
activityLogSchema.index({ target: 1, createdAt: -1 })
activityLogSchema.index({ createdAt: -1 })

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema)

export default ActivityLog
