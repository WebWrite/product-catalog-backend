import { HTTP_STATUS } from "../constants/statusCodes.js"
import OrderManager from "../managers/orderManager.js"
import AppError from "../utils/AppError.js"

class OrderController {
  static async createOrder(req, res) {
    const idempotencyKey = req.get("Idempotency-Key")

    if (!idempotencyKey || idempotencyKey.length > 255) {
      throw new AppError(
        "A valid Idempotency-Key header is required.",
        HTTP_STATUS.BAD_REQUEST
      )
    }

    const result = await OrderManager.createCodOrder(
      req.user.id,
      req.body,
      req.requestId,
      idempotencyKey
    )

    return res
      .status(result.replayed ? HTTP_STATUS.OK : HTTP_STATUS.CREATED)
      .json({
        success: true,
        message: result.replayed
          ? "Existing order returned successfully."
          : "Order created successfully.",
        data: { order: result.order }
      })
  }

  static async getMyOrdersController(req, res) {
    const orders = await OrderManager.getMyOrders(req.user.id, req.query)

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: orders
    })
  }

  static async cancelMyOrderItemController(req, res) {
    const { orderId, itemId } = req.body

    const order = await OrderManager.cancelMyOrderItem(
      req.user.id,
      orderId,
      itemId,
      req.requestId
    )

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Order item cancelled successfully.",
      data: { order }
    })
  }

  static async getMySellerOrdersController(req, res) {
    const orders = await OrderManager.getMySellerOrders(req.user.id, req.query)

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { orders }
    })
  }
  static async sellerOrderStats(req, res) {
    const data = await OrderManager.getMyOrdersStats(req.user.id)
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data
    })
  }

  static async updateSellerOrderItemStatusController(req, res) {
    const { orderId, itemId, status } = req.body

    const order = await OrderManager.updateMySellerOrderItemStatus(
      req.user.id,
      orderId,
      itemId,
      status,
      req.requestId
    )

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Order item status updated successfully.",
      data: { order }
    })
  }

  static async placeOrderStripe(req, res) {
    const idempotencyKey = req.get("Idempotency-Key")

    if (!idempotencyKey || idempotencyKey.length > 255) {
      throw new AppError(
        "A valid Idempotency-Key header is required.",
        HTTP_STATUS.BAD_REQUEST
      )
    }

    const result = await OrderManager.createStripeCheckout(
      req.user.id,
      req.body,
      req.requestId,
      idempotencyKey
    )

    return res
      .status(result.replayed ? HTTP_STATUS.OK : HTTP_STATUS.CREATED)
      .json({
        success: true,
        message: result.replayed
          ? "Existing Stripe checkout returned successfully."
          : "Stripe Checkout Session created successfully.",
        data: {
          orderId: result.orderId,
          checkoutUrl: result.checkoutUrl
        }
      })
  }

  static async retryStripePayment(req, res) {
    const result = await OrderManager.retryStripePayment(
      req.user.id,
      req.body.orderId,
      req.requestId
    )

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Stripe checkout URL generated successfully.",
      data: result
    })
  }

  static async handleStripeWebhook(req, res) {
    await OrderManager.handleStripeWebhook(
      req.body,
      req.headers["stripe-signature"],
      req.requestId
    )

    return res.status(200).send("Webhook received")
  }
}

export default OrderController
