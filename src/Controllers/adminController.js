import { ERROR_MESSAGES } from "../constants/errorMessages.js"
import { HTTP_STATUS } from "../constants/statusCodes.js"
import { SUCCESS_MESSAGES } from "../constants/successMessages.js"
import AdminManager from "../managers/adminManager.js"
import { logActivity } from "../utils/activityLog.util.js"
import AppError from "../utils/AppError.js"

class AdminController {
  static async getActivityLogs(req, res) {
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100)
    const role = req.query.role === "buyer" ? "customer" : req.query.role
    const validRoles = ["admin", "seller", "customer"]

    if (role && !validRoles.includes(role)) {
      throw new AppError(
        "Invalid activity role filter",
        HTTP_STATUS.BAD_REQUEST
      )
    }

    const dateFrom = req.query.dateFrom
      ? new Date(`${req.query.dateFrom}T00:00:00.000Z`)
      : undefined
    const dateTo = req.query.dateTo
      ? new Date(`${req.query.dateTo}T23:59:59.999Z`)
      : undefined

    if (
      (dateFrom && Number.isNaN(dateFrom.getTime())) ||
      (dateTo && Number.isNaN(dateTo.getTime())) ||
      (dateFrom && dateTo && dateFrom > dateTo)
    ) {
      throw new AppError("Invalid activity date range", HTTP_STATUS.BAD_REQUEST)
    }

    const logs = await AdminManager.getActivityLogs({
      page,
      limit,
      filter: {
        search: (req.query.search || "").trim(),
        role,
        target: (req.query.target || "").trim() || undefined,
        dateFrom,
        dateTo
      }
    })

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      ...logs
    })
  }

  static async getSummary(req, res) {
    const summary = await AdminManager.getSummary()
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      summary
    })
  }
  static async getRevenue(req, res) {
    let revenue = await AdminManager.getRevenueAnalytics()
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      revenue
    })
  }
  static async getTopCategories(req, res) {
    let categories = await AdminManager.getTopCategories()
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      categories
    })
  }

  static async getOrderSummary(req, res) {
    const summary = await AdminManager.getOrderSummary()
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      summary
    })
  }

  static async getCustomerSummary(req, res) {
    const summary = await AdminManager.getCustomerSummary()
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      summary
    })
  }

  static async getSellerSummary(req, res) {
    const summary = await AdminManager.getSellerSummary()
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      summary
    })
  }

  static async findOrders(req, res) {
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 5, 1), 50)

    const filter = {
      search: (req.query.search || "").trim(),
      payment: req.query.payment || null
    }

    const orders = await AdminManager.findOrder({ page, limit, filter })
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      orders
    })
  }

  static async findOrderById(req, res) {
    const order = await AdminManager.findOrderById(req.params.id)

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      order
    })
  }

  static async productSummary(req, res) {
    let summary = await AdminManager.getProductsSummary()
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      summary
    })
  }

  static async getAllProducts(req, res) {
    let {
      minPrice,
      maxPrice,
      sortBy,
      page,
      limit,
      status,
      search = "",
      category = null,
      inStock = null
    } = req.query
    page = Math.max(Number(page), 1)
    limit = Math.min(Math.max(Number(limit), 1), 15)

    let options = {
      minPrice,
      maxPrice,
      sortBy,
      status,
      page,
      limit,
      search,
      category,
      inStock
    }
    const products = await AdminManager.getAllProduct(options)
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.PRODUCTS_FETCHED,
      data: products
    })
  }

  static async updateProductByAdmin(req, res) {
    if (Object.keys(req.body || {}).length === 0 && !req.file) {
      throw new AppError(
        ERROR_MESSAGES.INVALID_REQUEST,
        HTTP_STATUS.BAD_REQUEST
      )
    }

    const product = await AdminManager.updateProductByAdmin(
      req.params.id,
      req.body,
      req.file?.buffer
    )

    await logActivity({
      userId: req.user.id,
      action: "PRODUCT UPDATED",
      target: "Product",
      role: req.user.role,
      message: "Admin updated a product",
      requestId: req.requestId,
      metadata: { productId: product._id }
    })

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.PRODUCT_UPDATED,
      product
    })
  }

  static async deleteProductByAdmin(req, res) {
    const product = await AdminManager.deleteProductManager(req.params.id)

    await logActivity({
      userId: req.user.id,
      action: "PRODUCT DELETED",
      target: "Product",
      role: req.user.role,
      message: "Admin deleted a product",
      requestId: req.requestId,
      metadata: { productId: product._id }
    })

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.PRODUCT_DELETED
    })
  }

  static async updateOrderItemStatusByAdmin(req, res) {
    const { orderId, itemId, status } = req.body

    const order = await AdminManager.updateAdminOrderItemStatus(
      orderId,
      itemId,
      status
    )
    await logActivity({
      userId: req.user.id,
      action: "UPDATE ORDER STATUS",
      target: "Order",
      role: req.user.role,
      message: "Admin update the order item status",
      requestId: req.requestId,
      metadata: { orderId: order._id }
    })

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { order }
    })
  }

  static async findAllSellers(req, res) {
    const { page, limit, status, category, search } = req.query

    let sellers = await AdminManager.allSellers({
      page,
      limit,
      status,
      category,
      search
    })
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      sellers
    })
  }

  static async getSellerDetail(req, res) {
    const id = req.params.id
    let seller = await AdminManager.finOneSeller(id)
    if (!seller) {
      throw new AppError(ERROR_MESSAGES.SELLER_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
    }
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      seller
    })
  }

  static async editSeller(req, res) {
    if (Object.keys(req.body || {}).length === 0) {
      throw new AppError(
        ERROR_MESSAGES.INVALID_REQUEST,
        HTTP_STATUS.BAD_REQUEST
      )
    }

    const seller = await AdminManager.editSeller(req.params.id, req.body)

    if (!seller) {
      throw new AppError(ERROR_MESSAGES.SELLER_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
    }
    await logActivity({
      userId: req.user.id,
      action: "UPDATE SELLER DETAILS",
      target: "Seller",
      role: req.user.role,
      message: "Admin update the seller",
      requestId: req.requestId,
      metadata: { sellerId: seller._id }
    })

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      seller
    })
  }

  static async findAllCustomers(req, res) {
    const { page, limit, status, search } = req.query
    const customers = await AdminManager.findCustomers({
      page,
      limit,
      status,
      search
    })
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: customers
    })
  }

  static async findCusomterOrders(req, res) {
    let id = req.params.id
    let orders = await AdminManager.findOneCustomerOrder(id)
    return res.status(HTTP_STATUS.OK).json({ success: true, data: orders })
  }

  static async updateCustomer(req, res) {
    const customer = await AdminManager.updateCustomer(req.params.id, req.body)

    if (!customer) {
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
    }
    await logActivity({
      userId: req.user.id,
      action: "UPDATE CUSTOMER DETAILS",
      target: "Seller",
      role: req.user.role,
      message: "Admin update the seller",
      requestId: req.requestId,
      metadata: { id: customer.id, name: customer.name, email: customer.email }
    })

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      customer
    })
  }
}

export default AdminController
