import mongoose from "mongoose"

const orderItemSchema = new mongoose.Schema(
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

    name: {
      type: String,
      required: true,
      trim: true
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    itemTotal: {
      type: Number,
      required: true,
      min: 0
    },

    size: {
      type: String,
      trim: true,
      default: null
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "delivered", "cancelled"],
      default: "pending",
      required: true
    }
  },
  { _id: true }
)

const orderSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: "An order must contain at least one item"
      }
    },

    shippingAddress: {
      fullName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
      },

      phone: {
        type: String,
        required: true,
        trim: true,
        maxlength: 30
      },

      address: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
      },

      city: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
      },

      postalCode: {
        type: String,
        required: true,
        trim: true,
        maxlength: 20
      }
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0
    },

    shippingCost: {
      type: Number,
      required: true,
      min: 0
    },

    total: {
      type: Number,
      required: true,
      min: 0
    },

    paymentMethod: {
      type: String,
      enum: ["STRIPE", "COD"],
      required: true
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
      required: true
    }
  },
  {
    timestamps: true
  }
)

orderSchema.index({ customerId: 1 })
orderSchema.index({ "items.sellerId": 1, createdAt: -1 })

const Order = mongoose.model("Order", orderSchema)

export default Order
