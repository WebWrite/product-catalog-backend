import fillMissingDays from "../helpers/fillMissingDays.js"
import Order from "../models/Order.js"
import Product from "../models/Product.js"
import SellerProfile from "../models/seller.profile.model.js"
import User from "../models/User.js"
import bcrypt from "bcryptjs"
import mongoose from "mongoose"
import ActivityLog from "../models/AcitivtyLog.js"

class AdminRepository {
  static async getActivityLogs(filter = {}, skip = 0, limit = 10) {
    const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const match = {}

    if (typeof filter.role === "string" && filter.role) match.role = filter.role
    if (typeof filter.target === "string" && filter.target)
      match.target = filter.target

    if (filter.dateFrom || filter.dateTo) {
      match.createdAt = {}
      if (filter.dateFrom) match.createdAt.$gte = filter.dateFrom
      if (filter.dateTo) match.createdAt.$lte = filter.dateTo
    }

    const searchTerm =
      typeof filter.search === "string" ? filter.search.trim() : ""

    if (searchTerm) {
      const searchRegex = new RegExp(escapeRegex(searchTerm), "i")
      const matchingUserIds = await User.distinct("_id", {
        $or: [{ name: searchRegex }, { email: searchRegex }]
      })

      match.$or = [
        { action: searchRegex },
        { target: searchRegex },
        { message: searchRegex },
        { userId: { $in: matchingUserIds } }
      ]
    }

    const [logs, total] = await Promise.all([
      ActivityLog.aggregate([
        { $match: match },
        { $sort: { createdAt: -1, _id: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: User.collection.name,
            localField: "userId",
            foreignField: "_id",
            as: "user"
          }
        },
        {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            _id: 1,
            action: 1,
            target: 1,
            role: 1,
            status: 1,
            message: 1,
            requestId: 1,
            metadata: 1,
            createdAt: 1,
            updatedAt: 1,
            user: {
              _id: "$user._id",
              name: "$user.name",
              email: "$user.email",
              role: "$user.role"
            }
          }
        }
      ]),
      ActivityLog.countDocuments(match)
    ])

    return { logs, total }
  }

  static async sumGrossValue() {
    let result = await Order.aggregate([
      { $unwind: "$items" },
      { $match: { "items.status": { $ne: "cancelled" } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$items.itemTotal" }
          //   itemsSold: { $count: "items.quantity" }
        }
      }
    ])
    return result[0]?.totalRevenue ?? 0
  }

  static async countOrder() {
    return await Order.countDocuments()
  }
  static async countSellers() {
    return await User.countDocuments({
      role: "seller",
      status: "active"
    })
  }
  static async countAccounts() {
    return await User.countDocuments({ role: "customer" })
  }

  static async orderSummary() {
    const now = new Date()
    const currentMonthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
    )
    const previousMonthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)
    )

    const [result] = await Order.aggregate([
      {
        $facet: {
          totalOrders: [{ $count: "count" }],
          inTransit: [
            { $match: { "items.status": "pending" } },
            { $count: "count" }
          ],
          deliveredOrders: [
            { $match: { "items.status": "delivered" } },
            { $count: "count" }
          ],
          lastMonthSubtotal: [
            {
              $match: {
                createdAt: {
                  $gte: previousMonthStart,
                  $lt: currentMonthStart
                }
              }
            },
            {
              $group: {
                _id: null,
                subtotal: { $sum: "$subtotal" }
              }
            }
          ]
        }
      }
    ])

    return {
      totalOrders: result.totalOrders[0]?.count ?? 0,
      inTransit: result.inTransit[0]?.count ?? 0,
      deliveredOrders: result.deliveredOrders[0]?.count ?? 0,
      lastMonthSubtotal: result.lastMonthSubtotal[0]?.subtotal ?? 0
    }
  }

  static async customerSummary() {
    const [customerCounts, orderSummary] = await Promise.all([
      User.aggregate([
        { $match: { role: "customer" } },
        {
          $group: {
            _id: null,
            totalCustomers: { $sum: 1 },
            activeCustomers: {
              $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] }
            }
          }
        }
      ]),
      Order.aggregate([
        { $unwind: "$items" },
        { $match: { "items.status": { $ne: "cancelled" } } },
        {
          $group: {
            _id: "$customerId",
            orderCount: { $addToSet: "$_id" },
            totalSpend: { $sum: "$items.itemTotal" }
          }
        },
        {
          $group: {
            _id: null,
            repeatBuyers: {
              $sum: {
                $cond: [{ $gt: [{ $size: "$orderCount" }, 1] }, 1, 0]
              }
            },
            totalSpend: { $sum: "$totalSpend" }
          }
        }
      ])
    ])

    return {
      totalCustomers: customerCounts[0]?.totalCustomers ?? 0,
      activeCustomers: customerCounts[0]?.activeCustomers ?? 0,
      repeatBuyers: orderSummary[0]?.repeatBuyers ?? 0,
      totalSpend: orderSummary[0]?.totalSpend ?? 0
    }
  }

  static async sellerSummary() {
    const [sellerCounts, gmvSummary] = await Promise.all([
      User.aggregate([
        { $match: { role: "seller" } },
        {
          $group: {
            _id: null,
            totalSellers: { $sum: 1 },
            activeSellers: {
              $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] }
            }
          }
        }
      ]),
      Order.aggregate([
        { $unwind: "$items" },
        { $match: { "items.status": { $in: ["confirmed", "delivered"] } } },
        {
          $group: {
            _id: null,
            gmv: { $sum: "$items.itemTotal" }
          }
        }
      ])
    ])

    return {
      totalSellers: sellerCounts[0]?.totalSellers ?? 0,
      activeSellers: sellerCounts[0]?.activeSellers ?? 0,
      gmv: gmvSummary[0]?.gmv ?? 0
    }
  }

  static async revenueByDay() {
    const since = new Date()
    since.setDate(since.getDate() - 29)
    since.setHours(0, 0, 0, 0)
    const data = await Order.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $unwind: "$items" },
      { $match: { "items.status": { $ne: "cancelled" } } },

      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
              timezone: "Asia/Karachi"
            }
          },
          totalPrice: { $sum: "$items.itemTotal" },
          orders: { $addToSet: "$_id" }
        }
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          totalPrice: 1,
          totalOrders: { $size: "$orders" }
        }
      },
      { $sort: { date: 1 } }
    ])
    return fillMissingDays(data, 30)
  }

  static async SalesByCategory(limit = 5) {
    return await Order.aggregate([
      { $unwind: "$items" },
      { $match: { "items.status": { $ne: "cancelled" } } },

      {
        $group: {
          _id: "$items.productId",
          revenue: { $sum: "$items.itemTotal" },
          unitsSold: { $sum: "$items.quantity" }
        }
      },

      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },

      {
        $group: {
          _id: { $ifNull: ["$product.category", "Uncategorized"] },
          totalSales: { $sum: "$revenue" },
          unitsSold: { $sum: "$unitsSold" },
          productCount: { $sum: 1 }
        }
      },

      { $sort: { totalSales: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          category: "$_id",
          totalSales: 1,
          unitsSold: 1,
          productCount: 1
        }
      }
    ])
  }

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
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date()
        }
      },
      { returnDocument: "after", runValidators: true }
    )
  }

  static async findOrderItem(orderId, itemId, session) {
    return Order.findOne({
      _id: orderId,
      items: {
        $elemMatch: { _id: itemId }
      }
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
        items: {
          $elemMatch: {
            _id: itemId,
            status: currentStatus
          }
        }
      },
      {
        $set: { "items.$.status": status }
      },
      {
        returnDocument: "after",
        session,
        runValidators: true
      }
    )
  }
  static async allSellers({
    page = 1,
    limit = 10,
    status,
    category,
    search
  } = {}) {
    page = Math.max(1, Number(page) || 1)
    limit = Math.min(100, Math.max(1, Number(limit) || 10))
    const skip = (page - 1) * limit

    const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

    const searchTerm = typeof search === "string" ? search.trim() : ""
    const categoryValue = typeof category === "string" ? category.trim() : ""

    const match = {
      role: "seller",
      ...(status === "active" || status === "inactive" ? { status } : {})
    }

    if (categoryValue) {
      const sellerIdsInCategory = await Product.distinct("sellerId", {
        category: categoryValue,
        isDeleted: { $ne: true }
      })
      match._id = { $in: sellerIdsInCategory }
    }

    if (searchTerm) {
      const regex = new RegExp(escapeRegex(searchTerm), "i")
      const profileUserIds = await SellerProfile.distinct("userId", {
        storeName: regex
      })

      match.$or = [
        { name: regex },
        { email: regex },
        { _id: { $in: profileUserIds } }
      ]
    }

    const pagePipeline = [
      { $match: match },
      { $sort: { createdAt: -1, _id: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: SellerProfile.collection.name,
          localField: "_id",
          foreignField: "userId",
          as: "profile"
        }
      },
      {
        $unwind: {
          path: "$profile",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: Product.collection.name,
          let: { sellerId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$sellerId", "$$sellerId"] },
                isDeleted: { $ne: true }
              }
            },
            { $count: "count" }
          ],
          as: "productStats"
        }
      },
      {
        $addFields: {
          productCount: {
            $ifNull: [{ $arrayElemAt: ["$productStats.count", 0] }, 0]
          }
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          status: 1,
          createdAt: 1,
          profile: 1,
          productCount: 1
        }
      }
    ]

    const [users, totalSellers] = await Promise.all([
      User.aggregate(pagePipeline),
      User.countDocuments(match)
    ])

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const sellerIds = users.map((user) => user._id)

    const monthlyStats = sellerIds.length
      ? await Order.aggregate([
          {
            $match: {
              createdAt: { $gte: monthStart },
              "items.sellerId": { $in: sellerIds }
            }
          },
          { $unwind: "$items" },
          {
            $match: {
              "items.sellerId": { $in: sellerIds },
              "items.status": { $in: ["confirmed", "delivered"] }
            }
          },
          {
            $group: {
              _id: "$items.sellerId",
              monthlySales: { $sum: "$items.itemTotal" },
              orders: { $addToSet: "$_id" }
            }
          },
          {
            $project: {
              monthlySales: 1,
              monthlyOrders: { $size: "$orders" }
            }
          }
        ])
      : []

    const statsBySeller = new Map(
      monthlyStats.map((item) => [item._id.toString(), item])
    )

    const sellers = users.map((user) => {
      const stats = statsBySeller.get(user._id.toString())

      return {
        userId: user._id,
        _id: user.profile?._id || null,
        name: user.name,
        email: user.email,
        status: user.status,
        createdAt: user.createdAt,
        storeName: user.profile?.storeName || null,
        storeType: user.profile?.storeType || null,
        productCount: user.productCount,
        monthlySales: stats?.monthlySales || 0,
        monthlyOrders: stats?.monthlyOrders || 0
      }
    })

    const totalPages = Math.ceil(totalSellers / limit)

    return {
      sellers,
      pagination: {
        page,
        limit,
        totalSellers,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }
  }

  static async findOneSeller(id) {
    return await SellerProfile.findById(id)
      .select("storeName storeType userId")
      .populate({
        path: "userId",
        select: "name email role status isVerified createdAt"
      })
  }

  static async editSeller(data) {
    const { id, name, storeName, storeType, status, password } = data

    const seller = await SellerProfile.findById(id)

    if (!seller) return null

    const userUpdate = {}

    if (name !== undefined) {
      userUpdate.name = name
    }

    if (password) {
      userUpdate.password = await bcrypt.hash(password, 10)
      userUpdate.refreshToken = null
    }

    if (status !== undefined) {
      userUpdate.status = status
      if (status === "inactive") {
        userUpdate.refreshToken = null
      }
    }

    await User.findOneAndUpdate(
      { _id: seller.userId, role: "seller" },
      { $set: userUpdate },
      { returnDocument: "after", runValidators: true }
    ).select("name email role status isVerified createdAt")

    await SellerProfile.findByIdAndUpdate(
      id,
      {
        $set: {
          storeName,
          storeType
        }
      },
      {
        returnDocument: "after",
        runValidators: true
      }
    )

    return await this.findOneSeller(id)
  }

  static async findCustomers(options = {}) {
    const page = Math.max(1, Number(options.page) || 1)
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 10))
    const skip = (page - 1) * limit

    const filter = { role: "customer" }

    if (options.status && typeof options.status === "string") {
      filter.status = options.status
    }

    const searchTerm =
      typeof options.search === "string" ? options.search.trim() : ""

    if (searchTerm) {
      const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      const regex = new RegExp(escaped, "i")
      filter.$or = [{ name: regex }, { email: regex }]
    }

    const [customers, totalCustomers] = await Promise.all([
      User.aggregate([
        { $match: filter },
        { $sort: { name: 1, _id: 1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: Order.collection.name,
            localField: "_id",
            foreignField: "customerId",
            pipeline: [
              { $unwind: "$items" },
              { $match: { "items.status": { $ne: "cancelled" } } },
              {
                $group: {
                  _id: "$_id",
                  total: { $sum: "$items.itemTotal" }
                }
              }
            ],
            as: "orders"
          }
        },
        {
          $project: {
            _id: 1,
            name: 1,
            email: 1,
            status: 1,
            totalOrders: { $size: "$orders" },
            lifetimeSpent: { $sum: "$orders.total" }
          }
        }
      ]),
      User.countDocuments(filter)
    ])

    return {
      customers,
      pagination: {
        page,
        limit,
        totalCustomers,
        totalPages: Math.ceil(totalCustomers / limit)
      }
    }
  }

  static async findOneCustomerOrder(id) {
    return await Order.find({ customerId: id })
  }

  static async updateCustomer(id, data) {
    const update = { ...data }

    if (update.password) {
      update.password = await bcrypt.hash(update.password, 10)
      update.refreshToken = null
    }
    if (update.status === "inactive") {
      update.refreshToken = null
    }

    return await User.findOneAndUpdate(
      { _id: id, role: "customer" },
      { $set: update },
      { returnDocument: "after", runValidators: true }
    ).select("name email role status isVerified createdAt")
  }

  static async findAllProducts(options) {
    const filter = {}
    if (options.status) {
      filter.status = options.status
    }

    if (options.minPrice != null || options.maxPrice != null) {
      filter.price = {}
      if (options.minPrice != null) {
        filter.price.$gte = Number(options.minPrice)
      }

      if (options.maxPrice != null) {
        filter.price.$lte = Number(options.maxPrice)
      }
    }

    if (options.search?.trim()) {
      filter.name = {
        $regex: options.search.trim(),
        $options: "i"
      }
    }
    if (options.category) {
      filter.category = options.category
    }

    if (options.inStock === true || options.inStock === "true") {
      filter.stock = {
        $gte: 1
      }
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
export default AdminRepository
