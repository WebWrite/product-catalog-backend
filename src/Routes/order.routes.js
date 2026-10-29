import { Router } from "express"
import allowedRoles from "../middlewares/allowedRoles.js"
import authentication from "../middlewares/authentication.middleware.js"
import validate from "../middlewares/validate.js"
import OrderController from "../Controllers/orderController.js"
import {
  cancelOrderItemSchema,
  createCodOrderSchema,
  updateSellerOrderItemStatusSchema
} from "../validations/orderValidation.js"
import { asyncHandler } from "../utils/wrapasync.js"

const router = Router()

/**
 * @swagger
 * /api/v1/orders/cod:
 *   post:
 *     tags: [Orders]
 *     summary: Create a cash-on-delivery order
 *     security: [{ accessToken: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [shippingAddress]
 *             properties:
 *               shippingAddress:
 *                 type: object
 *                 required: [fullName, phone, address, city, postalCode]
 *                 properties:
 *                   fullName: { type: string, minLength: 2, maxLength: 100 }
 *                   phone: { type: string, pattern: '^[0-9]{10}$' }
 *                   address: { type: string, minLength: 5, maxLength: 500 }
 *                   city: { type: string, minLength: 2, maxLength: 100 }
 *                   postalCode: { type: string, minLength: 2, maxLength: 20 }
 *     responses:
 *       201: { description: Order created }
 *
 * /api/v1/orders/stripe:
 *   post:
 *     tags: [Orders]
 *     summary: Create a Stripe order
 *     security: [{ accessToken: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [shippingAddress]
 *             properties:
 *               shippingAddress:
 *                 type: object
 *                 required: [fullName, phone, address, city, postalCode]
 *                 properties:
 *                   fullName: { type: string, minLength: 2, maxLength: 100 }
 *                   phone: { type: string, pattern: '^[0-9]{10}$' }
 *                   address: { type: string, minLength: 5, maxLength: 500 }
 *                   city: { type: string, minLength: 2, maxLength: 100 }
 *                   postalCode: { type: string, minLength: 2, maxLength: 20 }
 *     responses:
 *       201: { description: Stripe order created }
 *
 * /api/v1/orders/my-orders:
 *   get:
 *     tags: [Orders]
 *     summary: Get the current user's orders
 *     security: [{ accessToken: [] }]
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, minimum: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, minimum: 1 } }
 *     responses:
 *       200: { description: User orders }
 *
 * /api/v1/orders/cancel-item:
 *   patch:
 *     tags: [Orders]
 *     summary: Cancel an order item
 *     security: [{ accessToken: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, itemId]
 *             properties:
 *               orderId: { type: string, pattern: '^[a-fA-F0-9]{24}$' }
 *               itemId: { type: string, pattern: '^[a-fA-F0-9]{24}$' }
 *     responses:
 *       200: { description: Order item cancelled }
 *
 * /api/v1/orders/stripe/retry:
 *   post:
 *     tags: [Orders]
 *     summary: Retry Stripe payment
 *     security: [{ accessToken: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, itemId, status]
 *             properties:
 *               orderId: { type: string, pattern: '^[a-fA-F0-9]{24}$' }
 *               itemId: { type: string, pattern: '^[a-fA-F0-9]{24}$' }
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, processing, shipped, delivered, cancelled]
 *     responses:
 *       200: { description: Payment retry started }
 *
 * /api/v1/seller/orders:
 *   get:
 *     tags: [Orders]
 *     summary: Get the seller's orders
 *     security: [{ accessToken: [] }]
 *     responses:
 *       200: { description: Seller orders }
 *
 * /api/v1/seller/orders/item-status:
 *   patch:
 *     tags: [Orders]
 *     summary: Update seller order item status
 *     security: [{ accessToken: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, itemId, status]
 *             properties:
 *               orderId: { type: string, pattern: '^[a-fA-F0-9]{24}$' }
 *               itemId: { type: string, pattern: '^[a-fA-F0-9]{24}$' }
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, processing, shipped, delivered, cancelled]
 *     responses:
 *       200: { description: Order item status updated }
 */
router.post(
  "/orders/cod",
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  allowedRoles("customer"),
  validate(createCodOrderSchema),
  asyncHandler(OrderController.createOrder)
)

router.get(
  "/orders/my-orders",
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  allowedRoles("customer"),
  asyncHandler(OrderController.getMyOrdersController)
)

router.patch(
  "/orders/cancel-item",
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  allowedRoles("customer"),
  validate(cancelOrderItemSchema),
  asyncHandler(OrderController.cancelMyOrderItemController)
)

router.post(
  "/orders/stripe",
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  allowedRoles("customer"),
  validate(createCodOrderSchema),
  asyncHandler(OrderController.placeOrderStripe)
)

router.post(
  "/orders/stripe/retry",
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  allowedRoles("customer"),
  asyncHandler(OrderController.retryStripePayment)
)
//router.post("/orders/stripe/webhook",express.raw({ type: "application/json" }),asyncHandler(OrderController.handleStripeWebhook));
//seller orders
router.get(
  "/seller/orders",
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  allowedRoles("seller"),
  asyncHandler(OrderController.getMySellerOrdersController)
)

router.patch(
  "/seller/orders/item-status",
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  allowedRoles("seller"),
  validate(updateSellerOrderItemStatusSchema),
  asyncHandler(OrderController.updateSellerOrderItemStatusController)
)

export default router
