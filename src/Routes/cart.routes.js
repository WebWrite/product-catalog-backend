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

/**
 * @swagger
 * /api/v1/cart:
 *   get:
 *     tags: [Cart]
 *     summary: Get the current user's cart
 *     security: [{ accessToken: [] }]
 *     responses:
 *       200: { description: Cart details }
 *   post:
 *     tags: [Cart]
 *     summary: Add an item to the cart
 *     security: [{ accessToken: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, quantity]
 *             properties:
 *               productId: { type: string, pattern: '^[a-fA-F0-9]{24}$' }
 *               quantity: { type: number, minimum: 1, maximum: 25 }
 *               size: { type: string, minLength: 1 }
 *     responses:
 *       200: { description: Item added }
 *   delete:
 *     tags: [Cart]
 *     summary: Delete the current user's cart
 *     security: [{ accessToken: [] }]
 *     responses:
 *       200: { description: Cart deleted }
 *
 * /api/v1/cart/merge:
 *   post:
 *     tags: [Cart]
 *     summary: Merge a guest cart
 *     security: [{ accessToken: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items]
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [productId, quantity]
 *                   properties:
 *                     productId: { type: string, pattern: '^[a-fA-F0-9]{24}$' }
 *                     quantity: { type: number, minimum: 1, maximum: 25 }
 *                     size: { type: string, minLength: 1 }
 *     responses:
 *       200: { description: Cart merged }
 *
 * /api/v1/cart/items/{itemId}:
 *   patch:
 *     tags: [Cart]
 *     summary: Edit a cart item
 *     security: [{ accessToken: [] }]
 *     parameters:
 *       - { in: path, name: itemId, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quantity]
 *             properties:
 *               quantity: { type: number, minimum: -25, maximum: 25 }
 *     responses:
 *       200: { description: Cart item updated }
 *   delete:
 *     tags: [Cart]
 *     summary: Delete a cart item
 *     security: [{ accessToken: [] }]
 *     parameters:
 *       - { in: path, name: itemId, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Cart item deleted }
 */
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
