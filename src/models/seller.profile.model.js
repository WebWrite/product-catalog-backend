import mongoose from "mongoose"
import { Schema, model } from "mongoose"

const sellerProfile = new Schema({
  storeName: { type: String, required: true },
  storeType: {
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
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
})

const SellerProfile = model("SellerProfile", sellerProfile)
export default SellerProfile
