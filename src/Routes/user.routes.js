import { Router } from "express"
import UserController from "../Controllers/UserController.js"
import authLimiter from "../middlewares/rateLimiting.js"
import authentication from "../middlewares/authentication.middleware.js"

const router = Router()
router.get(
  "/me",
  authLimiter,
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  UserController.getCurrentUser
)

export default router
