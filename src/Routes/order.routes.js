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
