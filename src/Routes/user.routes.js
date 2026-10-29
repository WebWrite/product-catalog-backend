import { Router } from "express"
import UserController from "../Controllers/UserController.js"
import authentication from "../middlewares/authentication.middleware.js"

const router = Router()

/**
 * @swagger
 * /api/v1/user/me:
 *   get:
 *     tags: [User]
 *     summary: Get the authenticated user
 *     security:
 *       - accessToken: []
 *     responses:
 *       200:
 *         description: Current user details
 *       401:
 *         description: Authentication token is missing or invalid
 */
router.get(
  "/me",
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  UserController.getCurrentUser
)

export default router
