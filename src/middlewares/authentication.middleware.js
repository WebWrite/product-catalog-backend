import jwt from "jsonwebtoken"
import AppError from "../utils/AppError.js"
import { ERROR_MESSAGES } from "../constants/errorMessages.js"
import { HTTP_STATUS } from "../constants/statusCodes.js"
import User from "../models/User.js"

const authentication = (requestToken, secretKey) => {
  return async (req, res, next) => {
    const token = req.cookies[requestToken]
    const refreshToken = req.cookies.refreshToken

    if (!token || !refreshToken) {
      return next(
        new AppError(ERROR_MESSAGES.TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED)
      )
    }

    let payload

    try {
      payload = jwt.verify(token, secretKey)

      const refreshPayload = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET_KEY
      )

      if (payload.id !== refreshPayload.id) {
        throw new Error("Token user mismatch")
      }
    } catch {
      return next(
        new AppError(ERROR_MESSAGES.TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED)
      )
    }

    try {
      const user = await User.findById(payload.id)
      if (user.status === "inactive") {
        console.log("user is inactive")
        return next(
          new AppError(
            ERROR_MESSAGES.ACCOUNT_INACTIVE,
            HTTP_STATUS.UNAUTHORIZED
          )
        )
      }

      if (!user || user.refreshToken !== refreshToken) {
        return next(
          new AppError(ERROR_MESSAGES.TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED)
        )
      }

      req.user = payload
      next()
    } catch (err) {
      next(err)
    }
  }
}

export default authentication
