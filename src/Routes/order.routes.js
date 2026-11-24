import { Router } from "express"
import allowedRoles from "../middlewares/allowedRoles.js"
import authentication from "../middlewares/authentication.middleware.js"
import validate from "../middlewares/validate.js"
import { sanitizeFields } from "../middlewares/sanitizeFields.middleware.js"
import OrderController from "../Controllers/orderController.js"
import {
  cancelOrderItemSchema,
  createCodOrderSchema,
  sellerOrdersQuerySchema,
  updateSellerOrderItemStatusSchema
} from "../validations/orderValidation.js"
import { asyncHandler } from "../utils/wrapasync.js"
import authLimiter from "../middlewares/rateLimiting.js"

const router = Router()

router.post(
  "/orders/cod",
  authLimiter(1, 10),
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  allowedRoles("customer"),
  sanitizeFields([
    "shippingAddress.fullName",
    "shippingAddress.address",
    "shippingAddress.city"
  ]),
  validate(createCodOrderSchema),
  asyncHandler(OrderController.createOrder)
)

router.get(
  "/orders/my-orders",
  authLimiter(1, 30),
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  allowedRoles("customer"),
  validate(sellerOrdersQuerySchema),
  asyncHandler(OrderController.getMyOrdersController)
)

router.patch(
  "/orders/cancel-item",
  authLimiter(1, 10),
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  allowedRoles("customer"),
  validate(cancelOrderItemSchema),
  asyncHandler(OrderController.cancelMyOrderItemController)
)

router.post(
  "/orders/stripe",
  authLimiter(1, 10),
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  allowedRoles("customer"),
  sanitizeFields([
    "shippingAddress.fullName",
    "shippingAddress.address",
    "shippingAddress.city"
  ]),
  validate(createCodOrderSchema),
  asyncHandler(OrderController.placeOrderStripe)
)

router.post(
  "/orders/stripe/retry",
  authLimiter(1, 10),
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  allowedRoles("customer"),
  asyncHandler(OrderController.retryStripePayment)
)
//router.post("/orders/stripe/webhook",express.raw({ type: "application/json" }),asyncHandler(OrderController.handleStripeWebhook));
//seller orders
router.get(
  "/seller/orders",
  authLimiter(1, 50),
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  allowedRoles("seller"),
  validate(sellerOrdersQuerySchema),
  asyncHandler(OrderController.getMySellerOrdersController)
)
router.get(
  "/seller/orders/stats",
  authLimiter(1, 50),
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  allowedRoles("seller"),
  asyncHandler(OrderController.sellerOrderStats)
)

router.patch(
  "/seller/orders/item-status",
  authLimiter(1, 20),
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  allowedRoles("seller"),
  validate(updateSellerOrderItemStatusSchema),
  asyncHandler(OrderController.updateSellerOrderItemStatusController)
)

export default router
