import mongoose from "mongoose"

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["admin_seller", "buyer_seller", "buyer_admin"],
      required: true
    },

    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      }
    ]
  },
  {
    timestamps: true
  }
)

conversationSchema.index({ participants: 1 })

const Conversation = mongoose.model("Conversation", conversationSchema)

export default Conversation
