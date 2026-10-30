import express from "express"
import { asyncHandler } from "../utils/wrapasync.js"
import OrderController from "../Controllers/orderController.js"
const router = express.Router()

/**
 * @swagger
 * /api/v1/orders/stripe/webhook:
 *   post:
 *     tags: [Payments]
 *     summary: Receive a Stripe webhook
 *     description: Stripe sends signed payment events to this endpoint.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Stripe event payload
 *             additionalProperties: true
 *     responses:
 *       200: { description: Webhook processed }
 */
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
