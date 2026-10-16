import mongoose from "mongoose"

const productSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    category: {
      type: String,
      enum: [
        "Clothing",
        "Electronics",
        "Beauty",
        "Furniture",
        "Sports",
        "Toys",
        "Food"
      ],
      required: true
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000
    },

    image: {
      url: {
        type: String,
        required: true
      },
      publicId: {
        type: String,
        required: true
      }
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },

    sizes: {
      type: [
        {
          type: String,
          enum: ["S", "M", "L", "XL"]
        }
      ],
      default: ["S", "M", "L", "XL"]
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      required: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

productSchema.index({ sellerId: 1 })
productSchema.virtual("seller", {
  ref: "SellerProfile",
  localField: "sellerId",
  foreignField: "userId",
  justOne: true
})

const Product = mongoose.model("Product", productSchema)

export default Product
