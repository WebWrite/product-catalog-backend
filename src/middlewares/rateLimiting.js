import rateLimit from "express-rate-limit"
import { ERROR_MESSAGES } from "../constants/errorMessages.js"

const authLimiter = (minutes, limit) => {
  return rateLimit({
    windowMs: minutes * 60 * 1000,
    limit,
    message: ERROR_MESSAGES.AUTH_LIMIT,
    standardHeaders: true,
    legacyHeaders: false
  })
}

export default authLimiter
