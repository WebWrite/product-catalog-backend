import { Router } from "express"
import authentication from "../middlewares/authentication.middleware.js"
import AuthController from "../Controllers/AuthController.js"
import validate from "../middlewares/validate.js"
import { sanitizeFields } from "../middlewares/sanitizeFields.middleware.js"
import {
  loginSchema,
  sellerSignUpSchema,
  sendLoginOtpSchema,
  signupSchema,
  verifyEmailOtpSchema,
  verifyLoginOtpSchema
} from "../validations/authValidation.js"
import authLimiter from "../middlewares/rateLimiting.js"
import { asyncHandler } from "../utils/wrapasync.js"
import refreshAuthentication from "../middlewares/refresh.middleware.js"
const router = Router()

router.post(
  "/login",
  authLimiter(1, 5),
  validate(loginSchema),
  asyncHandler(AuthController.Login)
)

router.post(
  "/logout",
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  asyncHandler(AuthController.Logout)
)
router.post(
  "/refresh-token",
  authLimiter(1, 5),
  refreshAuthentication("refreshToken", process.env.REFRESH_TOKEN_SECRET_KEY),
  asyncHandler(AuthController.refreshToken)
)

router.post(
  "/verify-email-otp",
  authLimiter(1, 3),
  validate(verifyEmailOtpSchema),
  asyncHandler(AuthController.verifyOtp)
)

router.post(
  "/verify-login-otp",
  authLimiter(1, 3),
  validate(verifyLoginOtpSchema),
  asyncHandler(AuthController.verifyLoginOtp)
)

router.post(
  "/send-login-otp",
  authLimiter(1, 3),
  validate(sendLoginOtpSchema),
  asyncHandler(AuthController.sendLoginOtp)
)

router.post(
  "/resend-email-otp",
  authLimiter(1, 3),
  validate(sendLoginOtpSchema),
  asyncHandler(AuthController.resendEmailOtp)
)

router.post(
  "/register-customer",
  sanitizeFields(["name"]),
  validate(signupSchema),
  authLimiter(1, 3),
  asyncHandler(AuthController.registerUser)
)

router.post(
  "/register-seller",
  sanitizeFields(["name", "storeName", "storeType"]),
  authLimiter(1, 3),
  validate(sellerSignUpSchema),
  asyncHandler(AuthController.registerSeller)
)

export default router
