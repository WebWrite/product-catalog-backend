import { createClient } from "redis"
import { ERROR_MESSAGES } from "../constants/errorMessages.js"
import { SUCCESS_MESSAGES } from "../constants/successMessages.js"
import logger from "./logger.js"

const redis = createClient({
  url: process.env.REDIS_URL
})

redis.on("error", (err) => {
  logger.error(ERROR_MESSAGES.REDIS_CONNECTION_FAILED, {
    error: err.message
  })
})

export const connectRedis = async () => {
  if (!process.env.REDIS_URL) {
    throw new Error(ERROR_MESSAGES.REDIS_CONNECTION_FAILED)
  }

  try {
    await redis.connect()
    logger.info(SUCCESS_MESSAGES.REDIS_CONNECTED)
  } catch (error) {
    logger.error(ERROR_MESSAGES.REDIS_CONNECTION_FAILED, {
      error: error.message
    })
    throw error
  }
}

export const disconnectRedis = async () => {
  if (redis.isOpen) {
    await redis.quit()
    logger.info(SUCCESS_MESSAGES.REDIS_DISCONNECT)
  }
}

export default redis
