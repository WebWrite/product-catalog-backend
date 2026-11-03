import { Server } from "socket.io"
import cookieParser from "cookie-parser"
import socketAuth from "../middlewares/socket.auth.js"
import registerChatHandlers from "./chat.handler.js"
import jwt from "jsonwebtoken"
import AppError from "../utils/AppError.js"

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
          throw new AppError("Invalid token")
        }

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
  })
  return io
}

export default initializeSocket
