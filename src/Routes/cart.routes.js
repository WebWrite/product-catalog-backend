import { Router } from "express"
import CartController from "../Controllers/cartController.js"
import { asyncHandler } from "../utils/wrapasync.js"
import { addCart } from "../validations/cartValidation.js"
import validate from "../middlewares/validate.js"

const router = Router()

router.post("/", validate(addCart), asyncHandler(CartController.AddCart))
export default router
