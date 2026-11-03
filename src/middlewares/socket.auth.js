import jwt from "jsonwebtoken"
import User from "../models/User.js"

const socketAuth = async (socket, next) => {
  try {
    const { accessToken, refreshToken } = socket.request.cookies || {}

    if (!accessToken || !refreshToken) {
      return next(new Error("Authentication required"))
    }

    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET_KEY)

    const refreshDecoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET_KEY
    )

    if (!decoded.id || !decoded.role || decoded.id !== refreshDecoded.id) {
      return next(new Error("Invalid tokens"))
    }

    const user = await User.findById(decoded.id).select("refreshToken")

    if (!user || user.refreshToken !== refreshToken) {
      return next(new Error("Invalid tokens"))
    }

    socket.data.user = {
      userId: decoded.id,
      role: decoded.role
    }
    socket.data.accessToken = accessToken

    next()
  } catch {
    next(new Error("Invalid or expired token"))
  }
}

export default socketAuth
