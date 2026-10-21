import mongoose from "mongoose"
import AppError from "../utils/AppError.js"
import { HTTP_STATUS } from "../constants/statusCodes.js"
import OrderRepository from "../repositories/order.repo.js"
import CartRepository from "../repositories/cart.repo.js"

const SHIPPING_COST = 10

const getProductSize = (product, requestedSize) => {
  const sizes = product.sizes ?? []

  if (sizes.length === 0) {
    if (requestedSize) {
      throw new AppError(
        `${product.name} does not support sizes.`,
        HTTP_STATUS.BAD_REQUEST
      )
    }

    return null
  }

  const matchedSize = sizes.find(
    (size) => size.toLowerCase() === requestedSize?.toLowerCase()
  )

  if (!matchedSize) {
    throw new AppError(
      `A valid size is required for ${product.name}.`,
      HTTP_STATUS.BAD_REQUEST
    )
  }

  return matchedSize
}

class OrderManager {
  static async createCodOrder(customerId, data) {
    if (!mongoose.isObjectIdOrHexString(customerId)) {
      throw new AppError("Invalid customer ID.", HTTP_STATUS.BAD_REQUEST)
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

        //  Decrease stock and  history entries.
        const historyEntries = []

        for (const item of items) {
          const product = await OrderRepository.decreaseStockForOrder(
            item.productId,
            item.quantity,
            session
          )

          if (!product) {
            throw new AppError(
              `Insufficient stock or unavailable product: ${item.name}.`,
              HTTP_STATUS.CONFLICT
            )
          }

          historyEntries.push({
            productId: product._id,
            sellerId: product.sellerId,
            previousStock: product.stock + item.quantity,
            newStock: product.stock,
            reason: "order"
          })
        }

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
            paymentStatus: "pending"
          },
          session
        )

        await OrderRepository.createOrderStockHistory(historyEntries, session)

        const result = await CartRepository.clearCartForOrder(
          customerId,
          session
        )

        if (result.matchedCount !== 1) {
          throw new AppError("Unable to clear the cart.", HTTP_STATUS.CONFLICT)
        }
        createdOrder = order
      })

      return createdOrder
    } finally {
      await session.endSession()
    }
  }

  static async getMyOrders(customerId) {
    return OrderRepository.findOrdersByCustomerId(customerId)
  }

  static async cancelMyOrderItem(customerId, orderId, itemId) {
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

        await OrderRepository.restoreOrderItemStock(item, session)
      })
      const cancelledItem = updatedOrder.items.find(
        (item) => item._id.toString() === itemId
      )

      return {
        _id: updatedOrder._id,
        shippingAddress: updatedOrder.shippingAddress,
        items: [cancelledItem]
      }
    } finally {
      await session.endSession()
    }
  }

  static async getMySellerOrders(sellerId) {
    return OrderRepository.findOrdersBySellerId(sellerId)
  }

  static async updateMySellerOrderItemStatus(
    sellerId,
    orderId,
    itemId,
    status
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

        if (["delivered", "cancelled"].includes(item.status)) {
          throw new AppError(
            `A ${item.status} item cannot be updated.`,
            HTTP_STATUS.BAD_REQUEST
          )
        }

        updatedOrder = await OrderRepository.updateSellerOrderItemStatus(
          orderId,
          itemId,
          sellerId,
          status,
          session
        )

        if (!updatedOrder) {
          throw new AppError(
            "Order item status could not be updated.",
            HTTP_STATUS.CONFLICT
          )
        }

        if (status === "cancelled") {
          await OrderRepository.restoreOrderItemStock(item, session)
        }
      })

      const updatedItem = updatedOrder.items.find(
        (item) => item._id.toString() === itemId
      )

      return {
        _id: updatedOrder._id,
        items: [updatedItem]
      }
    } finally {
      await session.endSession()
    }
  }
}

export default OrderManager
