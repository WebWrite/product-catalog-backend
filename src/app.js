import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import errorHandler from "./middlewares/error.middleware.js"
import requestLogger from "./middlewares/logger.js"
import notFound from "./middlewares/notFound.js"
import swaggerUi from "swagger-ui-express"
import swaggerJsdoc from "swagger-jsdoc"
import swaggerOptions from "./config/swagger.js"
import redis from "./config/redis.config.js"
import mongoose from "mongoose"

import authRoutes from "./Routes/auth.routes.js"
import userRoutes from "./Routes/user.routes.js"
import sellerRoutes from "./Routes/product.route.js"
import cartRoutes from "./Routes/cart.routes.js"
import orderRoutes from "./Routes/order.routes.js"
import adminRoutes from "./Routes/admin.routes.js"
import stripeWebHookRoutes from "./Routes/stripewebhook.routes.js"
import chatRoutes from "./Routes/chat.routes.js"
import sellerDashboardRoutes from "./Routes/selles.routes.js"

export const app = express()
const baseURL = "/api/v1"
app.set("trust proxy", 1)
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true
  })
)

app.use(cookieParser())

app.get("/health/live", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toLocaleString("en-GB", {
      timeZone: "Asia/Karachi"
    }),
    uptime: Math.floor(process.uptime())
  })
})

app.get("/health/ready", (req, res) => {
  const mongoReady = mongoose.connection.readyState === 1
  const redisReady = redis.isReady

  const isReady = mongoReady && redisReady

  res.status(isReady ? 200 : 503).json({
    status: isReady ? "ok" : "error",
    checks: {
      mongodb: mongoReady ? "connected" : "disconnected",
      redis: redisReady ? "connected" : "disconnected"
    }
  })
})

app.use(requestLogger)

app.use(`${baseURL}`, stripeWebHookRoutes)

app.use(express.json())

const swaggerDocs = swaggerJsdoc(swaggerOptions)
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs))

app.use(express.urlencoded({ extended: true }))
app.use(`${baseURL}/auth`, authRoutes)
app.use(`${baseURL}/user`, userRoutes)
app.use(`${baseURL}/chat`, chatRoutes)
app.use(`${baseURL}/cart`, cartRoutes)
app.use(`${baseURL}`, sellerRoutes)
app.use(`${baseURL}`, orderRoutes)
app.use(`${baseURL}`, sellerDashboardRoutes)
app.use(`${baseURL}/admin`, adminRoutes)

app.use(notFound)

app.use(errorHandler)
