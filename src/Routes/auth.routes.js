import { Router } from "express"
import authentication from "../middlewares/authentication.middleware.js"
import AuthController from "../Controllers/AuthController.js"
import validate from "../middlewares/validate.js"
import {
  loginSchema,
  sellerSignUpSchema,
  sendLoginOtpSchema,
  signupSchema,
  verifyEmailOtpSchema,
  verifyLoginOtpSchema
} from "../validations/authValidation.js"
import authLimiter from "../middlewares/rateLimiting.js"
import UserController from "../Controllers/UserController.js"
import { asyncHandler } from "../utils/wrapasync.js"
const router = Router()

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: login a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user1@gmail.com
 *               password:
 *                 type: string
 *                 example: asd!9323
 *     responses:
 *       200:
 *         description: Logged in successfully.
 */
router.post("/login", validate(loginSchema), asyncHandler(AuthController.Login))

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Invalidates the stored refresh token and clears authentication cookie.
 
 *
 *     responses:
 *       200:
 *         description: User logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logged out successfully.
 *       401:
 *         description:  token is missing 
 *       500:
 *         description: Internal server error
 */
router.post(
  "/logout",
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  asyncHandler(AuthController.Logout)
)
/**
 * @swagger
 * /api/v1/auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     description: Validates the refresh token and issues a new access and refresh token.
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Refresh token updated
 *       401:
 *         description:  token is missing
 *       500:
 *         description: Internal server error
 */
router.post(
  "/refresh-token",
  authentication("refreshToken", process.env.REFRESH_TOKEN_SECRET_KEY),
  asyncHandler(AuthController.refreshToken)
)

/**
 * @swagger
 * /api/v1/auth/verify-email-otp:
 *   post:
 *     summary: Verify email using OTP
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               otp:
 *                 type: string
 *                 pattern: '^[0-9]{6}$'
 *                 example: "123456"
 *     responses:
 *       201:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: OTP verified successfully
 *       400:
 *         description: Invalid request or OTP
 *       404:
 *         description: User not found
 *       410:
 *         description: OTP expired
 *       500:
 *         description: Internal server error
 */
router.post(
  "/verify-email-otp",
  validate(verifyEmailOtpSchema),
  asyncHandler(AuthController.verifyOtp)
)

/**
 * @swagger
 * /api/v1/auth/verify-login-otp:
 *   post:
 *     summary: Login using OTP
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               otp:
 *                 type: string
 *                 pattern: '^[0-9]{6}$'
 *                 example: "123456"
 *     responses:
 *       201:
 *         description: OTP verified and user logged in successfully
 *         headers:
 *           Set-Cookie:
 *             description: HTTP-only access and refresh token cookies
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: OTP verified successfully
 *                 user:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: Mateen
 *                     email:
 *                       type: string
 *                       example: user@example.com
 *                     role:
 *                       type: string
 *                       example: user
 *       400:
 *         description: Invalid request or OTP
 *       401:
 *         description: Invalid or expired OTP
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

router.post(
  "/verify-login-otp",
  validate(verifyLoginOtpSchema),
  asyncHandler(AuthController.verifyLoginOtp)
)

/**
 * @swagger
 * /api/v1/auth/send-login-otp:
 *   post:
 *     summary: Send login OTP
 
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Login OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: OTP sent successfully
 *       400:
 *         description: Invalid email
 *       404:
 *         description: User not found
 *       403:
 *         description: Email is not verified
 *       429:
 *         description: Too many OTP requests
 *       500:
 *         description: Internal server error
 */
router.post(
  "/send-login-otp",
  validate(sendLoginOtpSchema),
  asyncHandler(AuthController.sendLoginOtp)
)

/**
 * @swagger
 * /api/v1/auth/resend-email-otp:
 *   post:
 *     summary: Resend OTP for email verification
 
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Email verification OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: OTP sent successfully
 *       400:
 *         description: Invalid email
 *       404:
 *         description: User not found
 *       403:
 *         description: Email is not verified
 *       429:
 *         description: Too many OTP requests
 *       500:
 *         description: Internal server error
 */

router.post(
  "/resend-email-otp",
  validate(sendLoginOtpSchema),
  asyncHandler(AuthController.resendEmailOtp)
)

/**
 * @swagger
 * /api/v1/auth/register-customer:
 *   post:
 *     summary: Create a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: user1
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user1@gmail.com
 *               password:
 *                 type: string
 *                 example: asd!9323
 *     responses:
 *       200:
 *         description: User registered successfully
 */

router.post(
  "/register-customer",
  validate(signupSchema),
  authLimiter,
  asyncHandler(AuthController.registerUser)
)
/**
 * @swagger
 * /api/v1/auth/register-seller:
 *   post:
 *     summary: Create a new seller
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *               - storeName
 *               - storeType
 *             properties:
 *               name:
 *                 type: string
 *                 example: user1
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user1@gmail.com
 *               password:
 *                 type: string
 *                 example: asd!9323
 *               role:
 *                  type: string
 *                  example: seller
 *               storeName:
 *                   type: string
 *                   example: store1
 *               storeType:
 *                   type: string
 *                   example: wholesale
 *     responses:
 *       200:
 *         description: User registered successfully
 */

router.post(
  "/register-seller",
  validate(sellerSignUpSchema),
  authLimiter,
  asyncHandler(UserController.registerSeller)
)

export default router
