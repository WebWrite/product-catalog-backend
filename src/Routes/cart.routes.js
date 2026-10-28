import e, { Router } from "express"
import CartController from "../Controllers/cartController.js"
import { asyncHandler } from "../utils/wrapasync.js"
import { addCart, editCart, mergeCarts } from "../validations/cartValidation.js"
import validate from "../middlewares/validate.js"
import authentication from "../middlewares/authentication.middleware.js"
import authorization from "../middlewares/authorization.middleware.js"

const router = Router()
const cartAuthentication = [
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  authorization("customer")
]

router.get("/", ...cartAuthentication, asyncHandler(CartController.getCart))
router.post(
  "/",
  ...cartAuthentication,
  validate(addCart),
  asyncHandler(CartController.addCart)
)
router.post(
  "/merge",
  ...cartAuthentication,
  validate(mergeCarts),
  asyncHandler(CartController.mergeCarts)
)
router.patch(
  "/items/:itemId",
  ...cartAuthentication,
  validate(editCart),
  asyncHandler(CartController.editCart)
)

router.delete(
  "/",
  ...cartAuthentication,
  asyncHandler(CartController.deleteCart)
)
router.delete(
  "/items/:itemId",
  ...cartAuthentication,
  asyncHandler(CartController.deleteCartItem)
)

export default router
