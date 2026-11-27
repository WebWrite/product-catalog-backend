import "dotenv/config"
import { app } from "./app.js"
import { ERROR_MESSAGES } from "./constants/errorMessages.js"
import { connectDB, disconnectDB } from "./config/database.config.js"
import { SUCCESS_MESSAGES } from "./constants/successMessages.js"
import { connectRedis, disconnectRedis } from "./config/redis.config.js"
import { createServer } from "node:http"
import initializeSocket from "./sockets/socket.js"
import logger from "./config/logger.js"

const PORT = process.env.PORT
if (!PORT) {
  logger.error(ERROR_MESSAGES.SERVER_PORT_IS_MISSING)
  process.exit(1)
}

const httpServer = createServer(app)

let io
let isShuttingDown = false

const graceFullShutdown = async (signal) => {
  if (isShuttingDown) return
  isShuttingDown = true

  logger.info(`${signal} received. Starting graceful shutdown...`)
  const shutdownTimer = setTimeout(() => {
    logger.error("Graceful shutdown timed out")
    process.exit(1)
  }, 15000)

  shutdownTimer.unref()

  try {
    if (io) {
      await new Promise((res) => {
        io.close(() => {
          logger.info("Socket.IO and HTTP server closed")
          res()
        })
      })
    } else if (httpServer.listening) {
      await new Promise((res, rej) => {
        httpServer.close((err) => {
          if (err) {
            rej(err)
          } else {
            res()
          }
        })
      })
    }

    await disconnectDB()
    await disconnectRedis()
    logger.info("Graceful shutdown completed")

    clearTimeout(shutdownTimer)
    process.exit(0)
  } catch (error) {
    logger.error("Graceful shutdown failed:", error)

    clearTimeout(shutdownTimer)
    process.exit(1)
  }
}

process.on("SIGTERM", () => {
  graceFullShutdown("SIGTERM")
})

process.on("SIGINT", () => {
  graceFullShutdown("SIGINT")
})

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error)
  graceFullShutdown("uncaughtException")
})

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection:", reason)
  graceFullShutdown("unhandledRejection")
})

const runServer = async () => {
  try {
    await connectDB()
    await connectRedis()

    io = initializeSocket(httpServer)
    app.set("io", io)

    httpServer.listen(PORT, () => {
      logger.info(`${SUCCESS_MESSAGES.SERVER_IS_RUNNING} on PORT :: ${PORT}`)
    })
  } catch (error) {
    logger.error("Server startup failed:", error)
    process.exit(1)
  }
}
runServer()
