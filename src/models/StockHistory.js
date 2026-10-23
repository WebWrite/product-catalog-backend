import mongoose from "mongoose"

const stockHistorySchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },

    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    previousStock: {
      type: Number,
      required: true
    },
    newStock: {
      type: Number,
      required: true
    },

    reason: {
      type: String,
      enum: [
        "initial_stock",
        "restock",
        "order",
        "order_cancelled",
        "manual_adjustment"
      ],
      default: "manual_adjustment"
    }
  },
  {
    timestamps: true
  }
)

stockHistorySchema.index({ productId: 1 })

const StockHistory = mongoose.model("StockHistory", stockHistorySchema)

export default StockHistory
