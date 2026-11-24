import mongoose from "mongoose"
import AppError from "../utils/AppError.js"
import { HTTP_STATUS } from "../constants/statusCodes.js"
import OrderRepository from "../repositories/order.repo.js"
import CartRepository from "../repositories/cart.repo.js"
import ActivityLog from "../models/AcitivtyLog.js"
import OrderStockManager from "./orderStockManager.js"
import {
  SHIPPING_COST,
  getProductSize,
  generateRequestHash
} from "../utils/order.helper.js"
import StripePaymentManager from "./stripePaymentManager.js"
import StripeWebhookManager from "./stripeWebhookManager.js"

class OrderManager {
  static async createCodOrder(customerId, data, requestId, idempotencyKey) {
    if (!mongoose.isObjectIdOrHexString(customerId)) {
      throw new AppError("Invalid customer ID.", HTTP_STATUS.BAD_REQUEST)
    }

    const requestHash = generateRequestHash(data)

    const existingOrder = await OrderRepository.findByIdempotencyKey(
      customerId,
      idempotencyKey
    )

    if (existingOrder) {
      if (existingOrder.requestHash !== requestHash) {
        throw new AppError(
          "Idempotency key already used with different checkout data.",
          HTTP_STATUS.CONFLICT
        )
      }

      return {
        order: existingOrder,
        replayed: true
      }
    }

    const session = await mongoose.startSession()

    try {
      let createdOrder

      await session.withTransaction(async () => {
        const cart = await CartRepository.getCartForOrder(customerId, session)

        if (!cart?.items?.length) {
          throw new AppError("Your cart is empty.", HTTP_STATUS.BAD_REQUEST)
        }

        const cartItems = cart.items
        const productIds = cartItems.map((item) => item.productId)

        const products = await OrderRepository.findProductsForOrder(
          productIds,
          session
        )

        const items = cartItems.map((cartItem) => {
          const product = products.find(
            (product) =>
              product._id.toString() === cartItem.productId.toString()
          )

          if (!product) {
            throw new AppError(
              "One or more cart products no longer exist.",
              HTTP_STATUS.NOT_FOUND
            )
          }

          if (product.status !== "active") {
            throw new AppError(
              `${product.name} is not available.`,
              HTTP_STATUS.BAD_REQUEST
            )
          }

          return {
            productId: product._id,
            sellerId: product.sellerId,
            name: product.name,
            price: product.price,
            quantity: cartItem.quantity,
            itemTotal: product.price * cartItem.quantity,
            size: getProductSize(product, cartItem.size),
            status: "pending"
          }
        })

        // Bulk stock decrement
        await OrderStockManager.decreaseStock(items, session)

        // Prepare stock history
        await OrderStockManager.createStockHistory(items, session)

        const subtotal = items.reduce((sum, item) => sum + item.itemTotal, 0)

        const [order] = await OrderRepository.createOrder(
          {
            customerId,
            items,
            shippingAddress: {
              ...data.shippingAddress,
              phone: `+92${data.shippingAddress.phone}`
            },
            subtotal,
            shippingCost: SHIPPING_COST,
            total: subtotal + SHIPPING_COST,
            paymentMethod: "COD",
            paymentStatus: "pending",
            idempotencyKey,
            requestHash
          },
          session
        )

        const result = await CartRepository.clearCartForOrder(
          customerId,
          session
        )

        if (result.matchedCount !== 1) {
          throw new AppError("Unable to clear the cart.", HTTP_STATUS.CONFLICT)
        }

        createdOrder = order

        await ActivityLog.create({
          userId: customerId,
          action: "ORDER_CREATED",
          target: "Order",
          role: "customer",
          status: "success",
          message: "Customer created a COD order",
          requestId,
          metadata: {
            orderId: order._id,
            paymentMethod: "COD",
            total: order.total
          }
        })
      })

      return createdOrder
    } finally {
      await session.endSession()
    }
  }

  static async getMyOrders(customerId, filters) {
    return OrderRepository.findOrdersByCustomerId(customerId, filters)
  }

  static async cancelMyOrderItem(customerId, orderId, itemId, requestId) {
    const session = await mongoose.startSession()

    try {
      let updatedOrder

      await session.withTransaction(async () => {
        const order = await OrderRepository.findCustomerOrder(
          orderId,
          customerId,
          session
        )

        if (!order) {
          throw new AppError("Order not found.", HTTP_STATUS.NOT_FOUND)
        }

        const item = order.items.find((item) => item._id.toString() === itemId)

        if (!item) {
          throw new AppError("Order item not found.", HTTP_STATUS.NOT_FOUND)
        }

        if (item.status !== "pending") {
          throw new AppError(
            "Only pending items can be cancelled.",
            HTTP_STATUS.BAD_REQUEST
          )
        }

        updatedOrder = await OrderRepository.cancelPendingOrderItem(
          orderId,
          itemId,
          customerId,
          session
        )

        if (!updatedOrder) {
          throw new AppError(
            "This item can no longer be cancelled.",
            HTTP_STATUS.CONFLICT
          )
        }

        if (order.paymentMethod === "COD") {
          await OrderStockManager.restoreOrderItemStock(item, session)
        }
      })

      const cancelledItem = updatedOrder.items.find(
        (item) => item._id.toString() === itemId
      )

      await ActivityLog.create({
        userId: customerId,
        action: "ORDER_ITEM_CANCELLED",
        target: "Order",
        role: "customer",
        status: "success",
        message: "Customer cancelled an order item",
        requestId,
        metadata: {
          orderId: updatedOrder._id,
          itemId
        }
      })

      return {
        _id: updatedOrder._id,
        shippingAddress: updatedOrder.shippingAddress,
        items: [cancelledItem]
      }
    } finally {
      await session.endSession()
    }
  }

  static async getMySellerOrders(sellerId, query) {
    const filters = {
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 10,
      search: query.search?.trim() || "",
      paymentMethod: query.paymentMethod || "",
      paymentStatus: query.paymentStatus || ""
    }

    return OrderRepository.findOrdersBySellerId(sellerId, filters)
  }
  static async getMyOrdersStats(sellerId) {
    return OrderRepository.orderStats(sellerId)
  }

  static async updateMySellerOrderItemStatus(
    sellerId,
    orderId,
    itemId,
    status,
    requestId
  ) {
    const session = await mongoose.startSession()

    try {
      let updatedOrder

      await session.withTransaction(async () => {
        const order = await OrderRepository.findSellerOrderItem(
          orderId,
          itemId,
          sellerId,
          session
        )

        if (!order) {
          throw new AppError(
            "Order item not found for this seller.",
            HTTP_STATUS.NOT_FOUND
          )
        }

        const item = order.items.find((item) => item._id.toString() === itemId)

        if (order.paymentMethod === "STRIPE") {
          if (!(
            (item.status === "pending" && status === "cancelled") ||
            (item.status === "confirmed" && status === "delivered")
          )) {
            throw new AppError(
              "Invalid item status transition.",
              HTTP_STATUS.BAD_REQUEST
            )
          }
        } else if (order.paymentMethod === "COD") {
          if (
            item.status !== "pending" ||
            !["cancelled", "delivered"].includes(status)
          ) {
            throw new AppError(
              "Invalid item status transition.",
              HTTP_STATUS.BAD_REQUEST
            )
          }
        } else {
          throw new AppError(
            "Unsupported payment method.",
            HTTP_STATUS.BAD_REQUEST
          )
        }

        updatedOrder = await OrderRepository.updateSellerOrderItemStatus(
          orderId,
          itemId,
          sellerId,
          item.status,
          status,
          session
        )

        if (!updatedOrder) {
          throw new AppError(
            "Order item status could not be updated.",
            HTTP_STATUS.CONFLICT
          )
        }

        if (status === "cancelled" && order.paymentMethod === "COD") {
          await OrderStockManager.restoreOrderItemStock(item, session)
        }
      })

      const updatedItem = updatedOrder.items.find(
        (item) => item._id.toString() === itemId
      )

      await ActivityLog.create({
        userId: sellerId,
        action: "ORDER_ITEM_STATUS_UPDATED",
        target: "Order",
        role: "seller",
        status: "success",
        message: `Seller updated an order item status to ${status}`,
        requestId,
        metadata: {
          orderId: updatedOrder._id,
          itemId,
          newStatus: status
        }
      })

      return {
        _id: updatedOrder._id,
        items: [updatedItem]
      }
    } finally {
      await session.endSession()
    }
  }
  static async createStripeCheckout(
    customerId,
    data,
    requestId,
    idempotencyKey
  ) {
    return StripePaymentManager.createStripeCheckout(
      customerId,
      data,
      requestId,
      idempotencyKey
    )
  }

  static async handleStripeWebhook(rawBody, signature, requestId) {
    return StripeWebhookManager.handleStripeWebhook(
      rawBody,
      signature,
      requestId
    )
  }

  static async retryStripePayment(customerId, orderId, requestId) {
    return StripePaymentManager.retryStripePayment(
      customerId,
      orderId,
      requestId
    )
  }
}

export default OrderManager
