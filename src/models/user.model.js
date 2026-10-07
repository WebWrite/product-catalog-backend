import mongoose from "mongoose"
import { Schema, model } from "mongoose"

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    refreshToken: { type: String, default: null },
    role: { type: String, enum: ["seller", "buyer"], default: "buyer" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  {
    timestamps: true
  }
)

const User = model("User", userSchema)
export default User
