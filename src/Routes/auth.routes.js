import { Router } from "express"
import authentication from "../middlewares/authentication.middleware.js"
import AuthController from "../Controllers/AuthController.js"
const router = Router()
router.post("/login", AuthController.Login)
router.post(
  "/logout",
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  AuthController.Logout
)
router.post(
  "/refresh-token",
  authentication("refreshToken", process.env.REFRESH_TOKEN_SECRET_KEY),
  AuthController.refreshToken
)
export default router
