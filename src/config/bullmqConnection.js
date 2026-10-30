import IORedis from "ioredis"

const bullmqConnection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null
})

bullmqConnection.on("error", (error) => {
  console.error("BullMQ Redis connection error:", error.message)
})

export default bullmqConnection
