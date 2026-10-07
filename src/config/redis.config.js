import { createClient } from "redis"
import { ERROR_MESSAGES } from "../constants/errorMessages.js"
import { SUCCESS_MESSAGES } from "../constants/successMessages.js"

const redis = createClient({
  url: process.env.REDIS_URL
})

redis.on("error", (err) => {
  console.error(ERROR_MESSAGES.REDIS_CONNECTION_FAILED, err)
})

export const connectRedis = async () => {
  try {
    await redis.connect()
    console.log(SUCCESS_MESSAGES.REDIS_CONNECTED)
  } catch (error) {
    console.error(ERROR_MESSAGES.REDIS_CONNECTION_FAILED, error)
  }
}

export default redis
