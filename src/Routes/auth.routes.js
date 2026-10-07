import { Router } from "express"
import authentication from "../middlewares/authentication.middleware.js"
import AuthController from "../Controllers/AuthController.js"
import validate from "../middlewares/validate.js"
import { loginSchema } from "../validations/authValidation.js"
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
 * /auth/refresh-token:
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

export default router
