import AppError from "../utils/AppError.js"
import { HTTP_STATUS } from "../constants/statusCodes.js"
import OrderRepository from "../repositories/order.repo.js"

class OrderStockManager {
  static async decreaseStock(items, session) {
    const operations = items.map((item) => ({
      updateOne: {
        filter: {
          _id: item.productId,
          status: "active",
          stock: { $gte: item.quantity }
        },
        update: {
          $inc: { stock: -item.quantity }
        }
      }
    }))

    const result = await OrderRepository.decreaseStockForOrder(
      operations,
      session
    )

    if (result.matchedCount !== operations.length) {
      throw new AppError(
        "Insufficient stock or unavailable product.",
        HTTP_STATUS.CONFLICT
      )
    }

    return result
  }

  static async createStockHistory(items, session) {
    const productIds = items.map((item) => item.productId)

    const updatedProducts = await OrderRepository.findProductsForOrder(
      productIds,
      session
    )

    const historyEntries = items.map((item) => {
      const product = updatedProducts.find(
        (product) => product._id.toString() === item.productId.toString()
      )

      if (!product) {
        throw new AppError(
          "Product not found while creating stock history.",
          HTTP_STATUS.NOT_FOUND
        )
      }

      return {
        productId: product._id,
        sellerId: item.sellerId,
        previousStock: product.stock + item.quantity,
        newStock: product.stock,
        reason: "order"
      }
    })

    return OrderRepository.createOrderStockHistory(historyEntries, session)
  }

  static async restoreOrderItemStock(item, session) {
    return OrderRepository.restoreOrderItemStock(item, session)
  }
}

export default OrderStockManager
