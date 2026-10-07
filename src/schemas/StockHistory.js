import mongoose from "mongoose";

const stockHistorySchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    change: {
      type: Number,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: "Stock change must be an integer",
      },
    },

    reason: {
      type: String,
      enum: [
        "initial_stock",
        "restock",
        "order",
        "order_cancelled",
        "manual_adjustment",
      ],
      required: true,
    },

  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  }
);

stockHistorySchema.index({
  productId: 1,
  createdAt: -1,
});

const StockHistory = mongoose.model("StockHistory", stockHistorySchema);

export default StockHistory;