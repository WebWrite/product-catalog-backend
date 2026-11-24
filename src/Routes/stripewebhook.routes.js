import express from "express"
import { asyncHandler } from "../utils/wrapasync.js"
import OrderController from "../Controllers/orderController.js"
const router = express.Router()

router.post(
  "/orders/stripe/webhook",
  express.raw({ type: "application/json" }),
  (req, res, next) => {
    console.log("STRIPE webhook route hit successfully")
    next()
  },

  asyncHandler(OrderController.handleStripeWebhook)
)

export default router
