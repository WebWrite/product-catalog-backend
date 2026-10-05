import mongoose from "mongoose"
import { ERROR_MESSAGES } from "../constants/errorMessages.js"
import { SUCCESS_MESSAGES } from "../constants/successMessages.js"
const DB_URL = process.env.DATABASE_URL
if (!DB_URL) {
  console.log(ERROR_MESSAGES.DB_URL_IS_MISSING)
}
export const connectDB = async () => {
  try {
    await mongoose.connect(DB_URL)
    console.log(SUCCESS_MESSAGES.DATABASE_CONNECTED)
  } catch (err) {
    console.log(ERROR_MESSAGES.DATABASE_CONNECTION_ERROR, err)
  }
}
