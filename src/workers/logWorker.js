import "dotenv/config"

import { Worker } from "bullmq"
import path from "node:path"
import { readdir, unlink } from "node:fs/promises"
import bullmqConnection from "../config/bullmqConnection.js"
import logQueue from "../queues/logQueue.js"
import { uploadLogFile } from "../utils/cloudinary.util.js"

const LOG_DIR = path.resolve("logs")

await logQueue.upsertJobScheduler(
  "daily-log-archive",
  {
    pattern: "0 1 * * *",
    tz: "Asia/Karachi"
  },
  {
    name: "archive-logs",
    data: {},
    opts: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000
      }
    }
  }
)

const logWorker = new Worker(
  "log-archive",
  async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const date = yesterday.toISOString().slice(0, 10)
    const baseName = `app-${date}.log`

    const files = (await readdir(LOG_DIR)).filter(
      (file) => file === baseName || file.startsWith(`${baseName}.`)
    )

    for (const fileName of files) {
      const filePath = path.join(LOG_DIR, fileName)

      console.log("Uploading:", fileName)

      await uploadLogFile(filePath, fileName)
      await unlink(filePath)

      console.log("Uploaded and deleted:", fileName)
    }

    console.log(`Log  completed for ${date}`)
  },
  {
    connection: bullmqConnection
  }
)

logWorker.on("completed", (job) => {
  console.log(`Log archive job ${job.id} completed`)
})

logWorker.on("failed", (job, error) => {
  console.error(`Log archive job ${job?.id} failed:`, error.message)
})

export default logWorker
