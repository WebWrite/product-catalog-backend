import e, { Router } from "express"
import CartController from "../Controllers/cartController.js"
import { asyncHandler } from "../utils/wrapasync.js"
import { addCart, editCart, mergeCarts } from "../validations/cartValidation.js"
import validate from "../middlewares/validate.js"

const router = Router()

router.get("/", asyncHandler(CartController.getCart))
router.post("/", validate(addCart), asyncHandler(CartController.addCart))
router.post(
  "/merge",
  validate(mergeCarts),
  asyncHandler(CartController.mergeCarts)
)
router.patch(
  "/items/:itemId",
  validate(editCart),
  asyncHandler(CartController.editCart)
)

router.delete("/", asyncHandler(CartController.deleteCart))
router.delete("/items/:itemId", asyncHandler(CartController.deleteCartItem))

export default router
