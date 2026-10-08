import mongoose from "mongoose"

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 255
    },

    password: {
      type: String,
      required: true
    },
    refreshToken: {
      type: String,
      default: null
    },

    role: {
      type: String,
      enum: ["customer", "admin", "seller"],
      default: "customer",
      required: true
    },

    isVerified: {
      type: Boolean,
      default: false
    },

    status: {
      type: String,
      enum: ["active", "blocked", "suspended"],
      default: "active",
      required: true
    }
  },
  {
    timestamps: true
  }
)

userSchema.index({ email: 1 }, { unique: true })

const User = mongoose.model("User", userSchema)

export default User
