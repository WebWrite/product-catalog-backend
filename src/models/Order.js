import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: [
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

        name: {
          type: String,
          required: true,
          trim: true,
        },

        price: {
          type: Number,
          required: true,
          min: 0,
        },

        quantity: {
          type: Number,
          required: true,
          min: 1,
          validate: {
            validator: Number.isInteger,
            message: "Quantity must be an integer",
          },
        },

        size: {
          type: String,
          trim: true,
          default: null,
        },
      },
    ],

    shippingAddress: {

      fullName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
      },

      phone: {
        type: String,
        required: true,
        trim: true,
        maxlength: 30,
      },

      address: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500,
      },

      city: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
      },

      postalCode: {
        type: String,
        required: true,
        trim: true,
        maxlength: 20,
      },
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    shippingCost: {
      type: Number,
      required: true,
      min: 0,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentMethod: {
      type: String,
      enum: ["STRIPE", "COD"],
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "processing",
        "completed",
        "failed",
      ],
      default: "pending",
      required: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "pending",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({
  customerId: 1});

const Order = mongoose.model("Order", orderSchema);

export default Order;