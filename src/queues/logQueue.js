import { Queue } from "bullmq"
import bullmqConnection from "../config/bullmqConnection.js"

const logQueue = new Queue("log-archive", {
  connection: bullmqConnection
})

export default logQueue
