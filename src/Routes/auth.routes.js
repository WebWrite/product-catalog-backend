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
router.post("/verify-email-otp", AuthController.verifyOtp)
router.post("/verify-login-otp", AuthController.verifyLoginOtp)
router.post("/send-login-otp", AuthController.sendLoginOtp)
export default router
