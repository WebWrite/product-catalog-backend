import winston from "winston"
import DailyRotateFile from "winston-daily-rotate-file"

const fileTransport = new DailyRotateFile({
  dirname: "logs",
  filename: "app-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  maxSize: "20m"
})

const logger = winston.createLogger({
  level: "info",

  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),

    winston.format.printf((info) => {
      const { timestamp, level, message, stack, ...meta } = info

      const metadata = Object.keys(meta).length
        ? ` ${JSON.stringify(meta)}`
        : ""

      if (stack) {
        return `${timestamp} ${level.toUpperCase()}${metadata}\n${stack}`
      }

      return `${timestamp} ${level.toUpperCase()} ${message}${metadata}`
    })
  ),

  transports: [new winston.transports.Console(), fileTransport]
})

export default logger
