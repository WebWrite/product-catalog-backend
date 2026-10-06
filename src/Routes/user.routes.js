import { Router } from "express"
import UserController from "../Controllers/UserController.js"
import validate from "../middlewares/validate.js"
import { signupSchema } from "../validations/authValidation.js"
import authLimiter from "../middlewares/rateLimiting.js"
const router = Router()

router.post("/",validate(signupSchema),authLimiter, UserController.registerUser)

export default router
