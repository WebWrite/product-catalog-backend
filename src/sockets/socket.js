import { Server } from "socket.io"
import cookieParser from "cookie-parser"
import socketAuth from "../middlewares/socket.auth.js"
import registerChatHandlers from "./chat.handler.js"
import jwt from "jsonwebtoken"
import AppError from "../utils/AppError.js"
//import User from "../models/User.js"

const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true
    }
  })

  io.engine.use(cookieParser())
  io.use(socketAuth)

  io.on("connection", async (socket) => {
    const { userId } = socket.data.user

    await socket.join(`user:${userId}`)

    socket.use((packet, next) => {
      try {
        const payload = jwt.verify(
          socket.data.accessToken,
          process.env.ACCESS_TOKEN_SECRET_KEY
        )

        if (payload.id !== socket.data.user.userId) {
          throw new AppError("Invalid token ")
        }

        //     const refreshDecoded = jwt.verify(
        //       socket.data.refreshToken,
        //       process.env.REFRESH_TOKEN_SECRET_KEY
        //     )
        //     if (
        //   refreshDecoded.id !== userId
        // ) {
        //   throw new AppError("Invalid token")
        // }

        // const user = await User.findById(userId).select(
        //   "refreshToken status"
        // )

        // if (
        //   !user ||
        //   user.status !== "active" ||
        //   user.refreshToken !== socket.data.refreshToken
        // ) {
        //   throw new AppError("Session is no longer valid")
        // }

        next()
      } catch {
        socket.disconnect(true)
      }
    })
    console.log("Socket connected:", socket.id)

    registerChatHandlers(io, socket)

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", socket.id, reason)
    })
    // socket.on("connect_error", (error) => {
    //   console.log("Socket connection failed:", error.message)
    // })
  })
  return io
}

export default initializeSocket
