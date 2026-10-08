import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import errorHandler from "./middlewares/error.middleware.js"
import requestLogger from "./middlewares/logger.js"
import notFound from "./middlewares/notFound.js"
import swaggerUi from "swagger-ui-express"
import swaggerJsdoc from "swagger-jsdoc"
import swaggerOptions from "./config/swagger.js"

import authRoutes from "./Routes/auth.routes.js"
import userRoutes from "./Routes/user.routes.js"

//import userRoutes from "./Routes/user.routes.js"
export const app = express()
const baseURL = "/api/v1"
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true
  })
)

app.use(cookieParser())
app.use(express.json())

const swaggerDocs = swaggerJsdoc(swaggerOptions)
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs))

app.use(express.urlencoded({ extended: true }))
app.use(requestLogger)
app.use(`${baseURL}/auth`, authRoutes)
app.use(`${baseURL}/user`, userRoutes)

app.use(notFound)

app.use(errorHandler)
