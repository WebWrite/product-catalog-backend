import { Router } from "express"
import UserController from "../Controllers/UserController.js"
import authentication from "../middlewares/authentication.middleware.js"
import allowedRoles from "../middlewares/allowedRoles.js"
import validate from "../middlewares/validate.js"
import { UpdateProfile } from "../validations/authValidation.js"
import authLimiter from "../middlewares/rateLimiting.js"

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
  authLimiter(1, 20),
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  UserController.getCurrentUser
)

router.patch(
  "/",
  authLimiter(1, 10),
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  allowedRoles("customer", "admin"),
  validate(UpdateProfile),
  UserController.UpdateProfile
)

export default router
