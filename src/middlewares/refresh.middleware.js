import jwt from "jsonwebtoken"
import AppError from "../utils/AppError.js"
import { ERROR_MESSAGES } from "../constants/errorMessages.js"
import { HTTP_STATUS } from "../constants/statusCodes.js"
import User from "../models/User.js"

const refreshAuthentication = (requestToken, secretKey) => {
  return async (req, res, next) => {
    const token = req.cookies[requestToken]
    const accessToken = req.cookies.accessToken

    if (!token || !accessToken) {
      return next(
        new AppError(ERROR_MESSAGES.TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED)
      )
    }

    let payload

    try {
      payload = jwt.verify(token, secretKey)

      const accessPayload = jwt.verify(
        accessToken,
        process.env.ACCESS_TOKEN_SECRET_KEY,
        { ignoreExpiration: true }
      )

      if (payload.id !== accessPayload.id) {
        throw new Error("Token user mismatch")
      }
    } catch {
      return next(
        new AppError(ERROR_MESSAGES.TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED)
      )
    }

    try {
      const user = await User.findById(payload.id).select("refreshToken")

      if (!user || user.refreshToken !== token) {
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

export default refreshAuthentication
