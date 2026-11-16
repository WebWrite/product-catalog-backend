import IORedis from "ioredis"

const bullmqRedis = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null
})

bullmqRedis.on("error", (error) => {
  console.error("Refund Redis connection error:", error.message)
})

export default bullmqRedis
