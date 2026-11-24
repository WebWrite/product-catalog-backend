import { Router } from "express"
import CartController from "../Controllers/cartController.js"
import { asyncHandler } from "../utils/wrapasync.js"
import { addCart, editCart, mergeCarts } from "../validations/cartValidation.js"
import validate from "../middlewares/validate.js"
import authentication from "../middlewares/authentication.middleware.js"
import authorization from "../middlewares/authorization.middleware.js"
import authLimiter from "../middlewares/rateLimiting.js"

const router = Router()
const cartAuthentication = [
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  authorization("customer")
]

const cartReadLimiter = authLimiter(1, 60)
const cartWriteLimiter = authLimiter(1, 30)
const cartMergeLimiter = authLimiter(1, 10)

router.get("/", ...cartAuthentication, asyncHandler(CartController.getCart))
router.post(
  "/",
  cartReadLimiter,
  ...cartAuthentication,
  validate(addCart),
  asyncHandler(CartController.addCart)
)
router.post(
  "/merge",
  cartWriteLimiter,
  ...cartAuthentication,
  validate(mergeCarts),
  asyncHandler(CartController.mergeCarts)
)
router.patch(
  "/items/:itemId",
  cartWriteLimiter,
  ...cartAuthentication,
  validate(editCart),
  asyncHandler(CartController.editCart)
)

router.delete(
  "/",
  cartMergeLimiter,
  ...cartAuthentication,
  asyncHandler(CartController.deleteCart)
)
router.delete(
  "/items/:itemId",
  cartMergeLimiter,
  ...cartAuthentication,
  asyncHandler(CartController.deleteCartItem)
)

export default router
