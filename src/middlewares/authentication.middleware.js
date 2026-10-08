import jwt from "jsonwebtoken"
import AppError from "../utils/AppError.js"
import { ERROR_MESSAGES } from "../constants/errorMessages.js"
import { HTTP_STATUS } from "../constants/statusCodes.js"

const authentication = (requestToken, secretKey) => {
  return (req, res, next) => {
    const token = req.cookies[requestToken]
    if (!token) {
      throw new AppError(ERROR_MESSAGES.TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED)
    }
    try {
      const payload = jwt.verify(token, secretKey)
      req.user = payload
      next()
    } catch (err) {
      throw new AppError(ERROR_MESSAGES.TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED)
    }
  }
}
export default authentication
