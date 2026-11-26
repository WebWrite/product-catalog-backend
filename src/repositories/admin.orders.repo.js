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
        .sort({ createdAt: -1, _id: -1 })
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
    const search = options.search?.trim()

    const currentPage = Math.max(1, Number(options.page) || 1)
    const pageLimit = Math.max(1, Number(options.limit) || 15)
    const skip = (currentPage - 1) * pageLimit

    const sortOptions = {
      "high-to-low": { price: -1 },
      "low-to-high": { price: 1 }
    }

    const sort = sortOptions[options.sortBy] || { createdAt: -1 }

    const filter = { isDeleted: false }

    if (options.status) filter.status = options.status
    if (options.category) filter.category = options.category

    if (options.minPrice != null || options.maxPrice != null) {
      filter.price = {}

      if (options.minPrice != null) {
        filter.price.$gte = Number(options.minPrice)
      }

      if (options.maxPrice != null) {
        filter.price.$lte = Number(options.maxPrice)
      }
    }

    if (options.inStock === true || options.inStock === "true") {
      filter.stock = { $gte: 1 }
    }

    if (!search) {
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

    const filters = [{ equals: { path: "isDeleted", value: false } }]

    if (options.status) {
      filters.push({
        equals: { path: "status", value: options.status }
      })
    }

    if (options.category) {
      filters.push({
        equals: { path: "category", value: options.category }
      })
    }

    if (options.minPrice != null || options.maxPrice != null) {
      const range = { path: "price" }

      if (options.minPrice != null) {
        range.gte = Number(options.minPrice)
      }

      if (options.maxPrice != null) {
        range.lte = Number(options.maxPrice)
      }

      filters.push({ range })
    }

    if (options.inStock === true || options.inStock === "true") {
      filters.push({
        range: { path: "stock", gte: 1 }
      })
    }

    const compound = {
      filter: filters,
      must: [
        {
          autocomplete: {
            query: search,
            path: "name"
          }
        }
      ]
    }

    const [products, meta] = await Promise.all([
      Product.aggregate([
        {
          $search: {
            index: "default",
            compound,
            sort
          }
        },
        { $skip: skip },
        { $limit: pageLimit }
      ]),

      Product.aggregate([
        {
          $searchMeta: {
            index: "default",
            compound,
            count: { type: "total" }
          }
        }
      ])
    ])

    const total = meta[0]?.count?.total ?? 0

    await Product.populate(products, [
      { path: "sellerId", select: "name" },
      { path: "seller", select: "storeName storeType -_id" }
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
