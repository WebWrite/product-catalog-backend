import mongoose from "mongoose"
import { ERROR_MESSAGES } from "../constants/errorMessages.js"
import { SUCCESS_MESSAGES } from "../constants/successMessages.js"
import logger from "./logger.js"

const DB_URL = process.env.DATABASE_URL

export const connectDB = async () => {
  if (!DB_URL) {
    throw new Error(ERROR_MESSAGES.DB_URL_IS_MISSING)
  }

  try {
    await mongoose.connect(DB_URL)
    logger.info(SUCCESS_MESSAGES.DATABASE_CONNECTED)
  } catch (error) {
    logger.error(ERROR_MESSAGES.DATABASE_CONNECTION_ERROR, {
      error: error.message
    })
    throw error
  }
}

export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect()
    logger.info(SUCCESS_MESSAGES.DATABASE_DISCONNECT)
  }
}
