import mongoose from "mongoose"

const attachmentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["image", "pdf"],
    required: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  }
})

const messageSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    text: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: null
    },

    attachment: {
      type: attachmentSchema,
      default: null
    },

    seen: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
)

messageSchema.index({ roomId: 1, createdAt: -1 })

messageSchema.index(
  { roomId: 1, recipientId: 1 },
  { partialFilterExpression: { seen: false } }
)

const Message = mongoose.model("Message", messageSchema)

export default Message
