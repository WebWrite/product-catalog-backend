import { Router } from "express"
import UserController from "../Controllers/UserController.js"
const router = Router()
router.post("/", UserController.registerUser)
router.post("/register-seller", UserController.registerSeller)
export default router
