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
      enum: [
        "pending",
        "completed",
        "failed",
        "refund_pending",
        "refunded",
        "refund_failed"
      ],
      default: "pending",
      required: true
    },
    paymentExpiresAt: {
      type: Date,
      default: null
    },
    idempotencyKey: {
      type: String,
      trim: true
    },
    requestHash: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
)

orderSchema.index(
  { customerId: 1, createdAt: -1, _id: -1 },
  { name: "customer_orders_created_at" }
)
orderSchema.index(
  { customerId: 1, paymentMethod: 1, createdAt: -1, _id: -1 },
  { name: "customer_orders_method_created_at" }
)
orderSchema.index(
  { customerId: 1, paymentStatus: 1, createdAt: -1, _id: -1 },
  { name: "customer_orders_status_created_at" }
)
orderSchema.index(
  {
    customerId: 1,
    paymentMethod: 1,
    paymentStatus: 1,
    createdAt: -1,
    _id: -1
  },
  { name: "customer_orders_method_status_created_at" }
)
orderSchema.index(
  { "items.sellerId": 1, createdAt: -1, _id: -1 },
  { name: "seller_orders_created_at" }
)
orderSchema.index(
  { "items.sellerId": 1, paymentMethod: 1, createdAt: -1, _id: -1 },
  { name: "seller_orders_method_created_at" }
)
orderSchema.index(
  { "items.sellerId": 1, paymentStatus: 1, createdAt: -1, _id: -1 },
  { name: "seller_orders_status_created_at" }
)
orderSchema.index(
  {
    "items.sellerId": 1,
    paymentMethod: 1,
    paymentStatus: 1,
    createdAt: -1,
    _id: -1
  },
  { name: "seller_orders_method_status_created_at" }
)
orderSchema.index(
  { createdAt: -1, _id: -1 },
  { name: "admin_orders_created_at" }
)
orderSchema.index(
  { paymentMethod: 1, createdAt: -1, _id: -1 },
  { name: "admin_orders_method_created_at" }
)
orderSchema.index({ paymentExpiresAt: 1 }, { expireAfterSeconds: 0 })
orderSchema.index(
  { customerId: 1, idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      idempotencyKey: { $type: "string" }
    }
  }
)
const Order = mongoose.model("Order", orderSchema)

export default Order
