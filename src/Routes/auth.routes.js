import { Router } from "express"
import authentication from "../middlewares/authentication.middleware.js"
import AuthController from "../Controllers/AuthController.js"
import validate from "../middlewares/validate.js"
import { loginSchema, sendLoginOtpSchema, verifyEmailOtpSchema, verifyLoginOtpSchema } from "../validations/authValidation.js"
const router = Router()

/**
 * @openapi
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
router.post("/login", validate(loginSchema), AuthController.Login)

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
  AuthController.Logout
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
  AuthController.refreshToken
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
router.post("/verify-email-otp", validate(verifyEmailOtpSchema), AuthController.verifyOtp)

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

router.post("/verify-login-otp", validate(sendLoginOtpSchema), AuthController.verifyLoginOtp)


/**
 * @swagger
 * /api/v1/auth/send-login-otp:
 *   post:
 *     summary: Send login OTP
 *     tags:
 *       - Authentication
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
router.post("/send-login-otp", validate(verifyLoginOtpSchema), AuthController.sendLoginOtp)

export default router
