import jwt from "jsonwebtoken"

const socketAuth = (socket, next) => {
  try {
    const token = socket.request.cookies?.accessToken

    if (!token) {
      return next(new Error("Authentication required"))
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET_KEY)

    if (!decoded.id || !decoded.role) {
      return next(new Error("Invalid access token"))
    }

    socket.data.user = {
      userId: decoded.id,
      role: decoded.role
    }

    next()
  } catch {
    next(new Error("Invalid or expired token"))
  }
}

export default socketAuth
