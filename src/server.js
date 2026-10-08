import "dotenv/config"
import { app } from "./app.js"
import { ERROR_MESSAGES } from "./constants/errorMessages.js"
import { connectDB } from "./config/database.config.js"
import { SUCCESS_MESSAGES } from "./constants/successMessages.js"
import { connectRedis } from "./config/redis.config.js"
const PORT = process.env.PORT
if (!PORT) {
  console.log(ERROR_MESSAGES.SERVER_PORT_IS_MISSING)
}
const runServer = async () => {
  await connectDB()
  connectRedis()
  app.listen(PORT, () => {
    console.log(`${SUCCESS_MESSAGES.SERVER_IS_RUNNING} on PORT :: ${PORT}`)
  })
}
runServer()
