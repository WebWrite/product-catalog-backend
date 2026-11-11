import rateLimit from "express-rate-limit"
import { ERROR_MESSAGES } from "../constants/errorMessages.js"

const authLimiter = (minutes, limit) => {
  return rateLimit({
    windowMs: minutes * 60 * 1000,
    limit,
    handler: (_request, response) => {
      response.status(429).json({
        success: false,
        message: ERROR_MESSAGES.AUTH_LIMIT
      })
    }
  })
}

export default authLimiter
