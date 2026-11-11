import jwt from "jsonwebtoken"
import User from "../models/User.js"
import { ERROR_MESSAGES } from "../constants/errorMessages.js"
import AppError from "../utils/AppError.js"
import { HTTP_STATUS } from "../constants/statusCodes.js"

const socketAuth = async (socket, next) => {
  try {
    const { accessToken, refreshToken } = socket.request.cookies || {}

    if (!accessToken || !refreshToken) {
      throw new AppError(ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED)
    }

    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET_KEY)

    const refreshDecoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET_KEY
    )

    if (!decoded.id || !decoded.role || decoded.id !== refreshDecoded.id) {
      throw new AppError(ERROR_MESSAGES.TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED)
    }

    const user = await User.findById(decoded.id)

    if (user.status === "inactive") {
      throw new AppError(
        ERROR_MESSAGES.ACCOUNT_INACTIVE,
        HTTP_STATUS.UNAUTHORIZED
      )
    }
    if (!user || user.refreshToken !== refreshToken) {
      throw new AppError(ERROR_MESSAGES.TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED)
    }

    socket.data.user = {
      userId: decoded.id,
      role: decoded.role
    }
    socket.data.accessToken = accessToken
    socket.data.refreshToken = refreshToken

    next()
  } catch (e) {
    next(e)
  }
}

export default socketAuth
