import "dotenv/config"
import { app } from "./app.js"
import { ERROR_MESSAGES } from "./constants/errorMessages.js"
import { connectDB } from "./config/database.config.js"
import { SUCCESS_MESSAGES } from "./constants/successMessages.js"
import { connectRedis } from "./config/redis.config.js"
import { createServer } from "node:http"
import initializeSocket from "./sockets/socket.js"
import logger from "./config/logger.js"

const PORT = process.env.PORT
if (!PORT) {
  logger.error(ERROR_MESSAGES.SERVER_PORT_IS_MISSING)
}

const httpServer = createServer(app)

const runServer = async () => {
  await connectDB()
  connectRedis()

  initializeSocket(httpServer)

  httpServer.listen(PORT, () => {
    logger.info(`${SUCCESS_MESSAGES.SERVER_IS_RUNNING} on PORT :: ${PORT}`)
  })
}
runServer()
