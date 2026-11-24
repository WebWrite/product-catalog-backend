import Order from "../models/Order.js"
import Product from "../models/Product.js"
import User from "../models/User.js"
import mongoose from "mongoose"

export default class AdminOrdersRepository {
  static async getOrder(filter, skip, limit) {
    const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const match = {}
    if (filter.payment) match.paymentMethod = filter.payment
    if (filter.search) {
      const regex = new RegExp(escapeRegex(filter.search), "i")
      const users = await User.find({
        $or: [{ name: regex }, { email: regex }]
      }).select("_id")

      const searchConditions = [
        { customerId: { $in: users.map((user) => user._id) } }
      ]

      if (mongoose.isValidObjectId(filter.search)) {
        searchConditions.push({ _id: filter.search })
      }

      match.$or = searchConditions
    }

    const [orders, total] = await Promise.all([
      Order.find(match)
        .populate("customerId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(match)
    ])

    return { orders, total }
  }

  static async findOrderById(orderId) {
    return await Order.findById(orderId)
      .populate("customerId", "name email")
      .populate("items.productId", "name image price")
      .populate("items.sellerId", "name email")
  }

  static async productSummary() {
    const totalProduct = await Product.countDocuments()
    const activeProduct = await Product.countDocuments({ status: "active" })
    const outOfStock = await Product.countDocuments({ stock: { $lte: 1 } })
    return { totalProduct, activeProduct, outOfStock }
  }

  static async updateProductByAdmin(productId, data) {
    return Product.findOneAndUpdate(
      { _id: productId },
      { $set: data },
      { returnDocument: "after", runValidators: true }
    ).lean()
  }

  static async deleteProductByAdmin(productId) {
    return Product.findOneAndUpdate(
      { _id: productId },
      { $set: { isDeleted: true, deletedAt: new Date() } },
      { returnDocument: "after", runValidators: true }
    )
  }

  static async findOrderItem(orderId, itemId, session) {
    return Order.findOne({
      _id: orderId,
      items: { $elemMatch: { _id: itemId } }
    }).session(session)
  }

  static async updateOrderItemStatus(
    orderId,
    itemId,
    currentStatus,
    status,
    session
  ) {
    return Order.findOneAndUpdate(
      {
        _id: orderId,
        items: { $elemMatch: { _id: itemId, status: currentStatus } }
      },
      { $set: { "items.$.status": status } },
      {
        returnDocument: "after",
        session,
        runValidators: true
      }
    )
  }

  static async findAllProducts(options) {
    const filter = {}
    if (options.status) filter.status = options.status

    if (options.minPrice != null || options.maxPrice != null) {
      filter.price = {}
      if (options.minPrice != null) filter.price.$gte = Number(options.minPrice)
      if (options.maxPrice != null) filter.price.$lte = Number(options.maxPrice)
    }

    if (options.search?.trim()) {
      filter.name = { $regex: options.search.trim(), $options: "i" }
    }
    if (options.category) filter.category = options.category
    if (options.inStock === true || options.inStock === "true") {
      filter.stock = { $gte: 1 }
    }

    const sortOptions = {
      "high-to-low": { price: -1 },
      "low-to-high": { price: 1 }
    }
    const sort = sortOptions[options.sortBy] || { createdAt: -1 }
    const currentPage = Math.max(1, Number(options.page) || 1)
    const pageLimit = Math.max(1, Number(options.limit) || 15)
    const skip = (currentPage - 1) * pageLimit

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(pageLimit)
        .populate("sellerId", "name")
        .populate("seller", "storeName storeType -_id")
        .lean(),
      Product.countDocuments(filter)
    ])

    return {
      products,
      total,
      page: currentPage,
      limit: pageLimit,
      totalPages: Math.ceil(total / pageLimit)
    }
  }
}
