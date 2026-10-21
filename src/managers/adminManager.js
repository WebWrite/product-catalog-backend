import mongoose from "mongoose"
import logger from "../config/logger.js"
import { ERROR_MESSAGES } from "../constants/errorMessages.js"
import { HTTP_STATUS } from "../constants/statusCodes.js"
import AdminRepository from "../repositories/admin.repo.js"
import {
  createStockHistory,
  findProductById
} from "../repositories/product.repo.js"
import AppError from "../utils/AppError.js"
import {
  deleteProductImage,
  uploadProductImage
} from "../utils/cloudinary.util.js"
import OrderRepository from "../repositories/order.repo.js"

class AdminManager {
  static async getSummary() {
    const [grossValue, totalOrder, totalSeller, totalRgisterAccount] =
      await Promise.all([
        AdminRepository.sumGrossValue(),
        AdminRepository.countOrder(),
        AdminRepository.countSellers(),
        AdminRepository.countAccounts()
      ])
    return { grossValue, totalOrder, totalSeller, totalRgisterAccount }
  }

  static async getRevenueAnalytics() {
    return await AdminRepository.revenueByDay()
  }
  static async getTopCategories() {
    return await AdminRepository.SalesByCategory()
  }

  static async findOrder({ filter, page, limit }) {
    const skip = (page - 1) * limit

    const { orders, total } = await AdminRepository.getOrder(
      filter,
      skip,
      limit
    )

    return {
      orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    }
  }

  static async getProductsSummary() {
    return await AdminRepository.productSummary()
  }

  static async updateProductByAdmin(productId, data, imageBuffer) {
    const currentProduct = await findProductById(productId)

    if (!currentProduct) {
      throw new AppError(
        ERROR_MESSAGES.PRODUCT_NOT_FOUND,
        HTTP_STATUS.NOT_FOUND
      )
    }

    const updateData = { ...data }
    let newImage

    const stockWasProvided = Object.hasOwn(data, "stock")
    const previousStock = currentProduct.stock
    const stockChanged = stockWasProvided && data.stock !== previousStock

    if (imageBuffer) {
      newImage = await uploadProductImage(imageBuffer)
      updateData.image = newImage
    }

    let updatedProduct

    try {
      updatedProduct = await AdminRepository.updateProductByAdmin(
        productId,
        updateData
      )
    } catch (error) {
      if (newImage?.publicId) {
        await this.cleanupProductImage(
          newImage.publicId,
          productId,
          "clean up newly uploaded"
        )
      }

      throw error
    }

    if (!updatedProduct) {
      if (newImage?.publicId) {
        await this.cleanupProductImage(
          newImage.publicId,
          productId,
          "clean up newly uploaded"
        )
      }

      throw new AppError(
        ERROR_MESSAGES.PRODUCT_NOT_FOUND,
        HTTP_STATUS.NOT_FOUND
      )
    }

    if (newImage && currentProduct.image?.publicId) {
      await this.cleanupProductImage(
        currentProduct.image.publicId,
        productId,
        "delete old"
      )
    }

    if (stockChanged) {
      await createStockHistory({
        productId: updatedProduct._id,
        sellerId: currentProduct.sellerId,
        previousStock,
        newStock: updatedProduct.stock
      })
    }

    return updatedProduct
  }

  static async cleanupProductImage(publicId, productId, action) {
    try {
      await deleteProductImage(publicId)
    } catch (error) {
      logger.error(`Failed to ${action} product image`, {
        productId,
        publicId,
        error: error.message
      })
    }
  }

  static async deleteProductManager(productId) {
    const product = await AdminRepository.deleteProductByAdmin(productId)

    if (!product) {
      throw new AppError(
        ERROR_MESSAGES.PRODUCT_NOT_FOUND,
        HTTP_STATUS.NOT_FOUND
      )
    }

    if (product.image?.publicId) {
      try {
        await deleteProductImage(product.image.publicId)
      } catch (cleanupError) {
        logger.error("Failed to clean up deleted product image", {
          productId: product._id.toString(),
          publicId: product.image.publicId,
          error: cleanupError.message
        })
      }
    }
    return product
  }

  static async updateAdminOrderItemStatus(orderId, itemId, status) {
    const session = await mongoose.startSession()

    try {
      let updatedOrder

      await session.withTransaction(async () => {
        const order = await AdminRepository.findOrderItem(
          orderId,
          itemId,
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

        updatedOrder = await AdminRepository.updateOrderItemStatus(
          orderId,
          itemId,
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

  static async allSellers({ page, limit, status, category, search }) {
    const ALLOWED_STATUS = ["active", "inactive", "all"]

    const safePage = Math.max(1, Number(page) || 1)
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 10))

    const safeStatus = ALLOWED_STATUS.includes(status) ? status : "all"
    const safeCategory = category?.trim() || undefined
    const safeSearch = search?.trim() || undefined

    return await AdminRepository.allSellers({
      page: safePage,
      limit: safeLimit,
      status: safeStatus,
      category: safeCategory,
      search: safeSearch
    })
  }

  static async finOneSeller(id) {
    return await AdminRepository.findOneSeller(id)
  }

  static async editSeller(id, data) {
    return await AdminRepository.editSeller({ id, ...data })
  }

  static async findCustomers(options) {
    return await AdminRepository.findCustomers(options)
  }

  static async findOneCustomerOrder(id) {
    return await AdminRepository.findOneCustomerOrder(id)
  }

  static async updateCustomer(id, data) {
    return await AdminRepository.updateCustomer(id, data)
  }
}
export default AdminManager
