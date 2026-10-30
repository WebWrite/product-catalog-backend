import { Server } from "socket.io"
import cookieParser from "cookie-parser"
import socketAuth from "../middlewares/socket.auth.js"
import registerChatHandlers from "./chat.handler.js"

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

    console.log("Socket connected:", socket.id)
    console.log("Authenticated user:", socket.data.user)

    registerChatHandlers(io, socket)

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", socket.id, reason)
    })
  })
  return io
}

export default initializeSocket
