import { Router } from "express"
import UserController from "../Controllers/UserController.js"
import authentication from "../middlewares/authentication.middleware.js"
import allowedRoles from "../middlewares/allowedRoles.js"
import validate from "../middlewares/validate.js"
import { UpdateProfile } from "../validations/authValidation.js"
import { sanitizeFields } from "../middlewares/sanitizeFields.middleware.js"
import authLimiter from "../middlewares/rateLimiting.js"

const router = Router()
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
  sanitizeFields(["name"]),
  validate(UpdateProfile),
  UserController.UpdateProfile
)

export default router
