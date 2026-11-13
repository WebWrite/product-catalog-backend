import { Queue } from "bullmq"
import bullmqRedis from "../config/bullmqRedis.js"

const refundQueue = new Queue("stripe-refunds", {
  connection: bullmqRedis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000
    },
    removeOnComplete: true,
    removeOnFail: false
  }
})

export default refundQueue
