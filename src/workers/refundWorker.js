import "dotenv/config"
import { Worker } from "bullmq"
import mongoose from "mongoose"
import bullmqRedis from "../config/bullmqRedis.js"
import { connectDB } from "../config/db.js"
import OrderManager from "../managers/orderManager.js"

const refundWorker = async () => {
  await connectDB()

  const worker = new Worker(
    "stripe-refunds",
    async (job) => {
      const { paymentId } = job.data

      console.log(`Processing refund job: ${job.id}`)

      return OrderManager.processStripeRefund(paymentId)
    },
    {
      connection: bullmqRedis,
      concurrency: 3
    }
  )

  worker.on("completed", (job) => {
    console.log(`Refund job ${job.id} completed successfully`)
  })

  worker.on("failed", (job, error) => {
    console.error(`Refund job ${job?.id} failed:`, error.message)
  })

  worker.on("error", (error) => {
    console.error("Refund worker error:", error.message)
  })

  console.log("Refund worker started")

  return worker
}

const worker = await refundWorker()

const shutdown = async () => {
  console.log("Shutting down refund worker...")

  await worker.close()
  await mongoose.disconnect()
  await bullmqRedis.quit()

  process.exit(0)
}

process.on("SIGTERM", shutdown)
process.on("SIGINT", shutdown)
