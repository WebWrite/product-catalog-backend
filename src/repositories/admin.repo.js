import fillMissingDays from "../helpers/fillMissingDays.js"
import Order from "../models/Order.js"
import Product from "../models/Product.js"
import SellerProfile from "../models/seller.profile.model.js"
import User from "../models/User.js"
import bcrypt from "bcryptjs"
import mongoose from "mongoose"

class AdminRepository {
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
            { $match: { "items.status": "shipped" } },
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
        { $match: { "items.status": { $ne: "cancelled" } } },
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
      { new: true, runValidators: true }
    ).lean()
  }

  static async deleteProductByAdmin(productId) {
    return Product.findOneAndDelete({
      _id: productId
    })
  }

  static async findOrderItem(orderId, itemId, session) {
    return Order.findOne({
      _id: orderId,
      items: {
        $elemMatch: { _id: itemId }
      }
    }).session(session)
  }

  static async updateOrderItemStatus(orderId, itemId, status, session) {
    return Order.findOneAndUpdate(
      {
        _id: orderId,
        items: {
          $elemMatch: {
            _id: itemId,

            status: { $nin: ["delivered", "cancelled"] }
          }
        }
      },
      {
        $set: { "items.$.status": status }
      },
      {
        new: true,
        session,
        runValidators: true
      }
    )
  }

  static async allSellers({ page = 1, limit = 10, status, category, search }) {
    page = Math.max(1, Number(page) || 1)
    limit = Math.min(100, Math.max(1, Number(limit) || 10))

    const filter = {}

    if (status === "active") {
      filter.status = "active"
    } else if (status === "inactive") {
      filter.status = { $in: ["blocked", "suspended"] }
    }

    if (search?.trim()) {
      const regex = new RegExp(
        search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      )

      filter.$or = [{ name: regex }, { email: regex }]
    }

    let usersQuery = User.find({
      role: "seller",
      ...filter
    }).select("name email status createdAt")

    if (category) {
      const sellerIds = await Product.distinct("sellerId", {
        category
      })

      usersQuery = usersQuery.where("_id").in(sellerIds)
    }

    const users = await usersQuery.lean()

    const userIds = users.map((user) => user._id)

    const profiles = await SellerProfile.find({
      userId: { $in: userIds },
      ...(search?.trim()
        ? {
            storeName: new RegExp(
              search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
              "i"
            )
          }
        : {})
    }).lean()

    const profileMap = new Map(
      profiles.map((profile) => [profile.userId.toString(), profile])
    )

    let sellers = users
      .filter(
        (user) =>
          !search?.trim() ||
          profileMap.has(user._id.toString()) ||
          new RegExp(
            search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            "i"
          ).test(user.name) ||
          new RegExp(
            search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            "i"
          ).test(user.email)
      )
      .map((user) => ({
        ...user,
        profile: profileMap.get(user._id.toString()) || null
      }))
      .sort((a, b) => b.createdAt - a.createdAt)

    const totalSellers = sellers.length
    const totalPages = Math.ceil(totalSellers / limit)

    sellers = sellers.slice((page - 1) * limit, page * limit)

    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const result = await Promise.all(
      sellers.map(async (seller) => {
        const [productCount, orderStats] = await Promise.all([
          Product.countDocuments({
            sellerId: seller._id
          }),

          Order.aggregate([
            { $match: { createdAt: { $gte: monthStart } } },
            { $unwind: "$items" },
            {
              $match: {
                "items.sellerId": seller._id,
                "items.status": { $ne: "cancelled" }
              }
            },
            {
              $group: {
                _id: null,
                monthlySales: { $sum: "$items.itemTotal" },
                orders: { $addToSet: "$_id" }
              }
            }
          ])
        ])

        const stats = orderStats[0] || {
          monthlySales: 0,
          orders: []
        }

        return {
          _id: seller.profile?._id || null,
          name: seller.name,
          email: seller.email,
          status: seller.status,
          createdAt: seller.createdAt,
          storeName: seller.profile?.storeName || null,
          storeType: seller.profile?.storeType || null,
          productCount,
          monthlySales: stats.monthlySales,
          monthlyOrders: stats.orders.length
        }
      })
    )

    return {
      sellers: result,
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
    const { id, storeName, storeType, status } = data
    const seller = await SellerProfile.findById(id)

    if (!seller) return null

    await SellerProfile.findByIdAndUpdate(
      id,
      { storeName, storeType },
      { runValidators: true }
    )

    await User.findByIdAndUpdate(
      seller.userId,
      { status },
      { runValidators: true }
    )

    return await this.findOneSeller(id)
  }
  static async findCustomers(options) {
    const page = Math.max(1, Number(options.page) || 1)
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 10))
    const filter = { role: "customer" }

    if (options.status) {
      filter.status = options.status
    }

    if (options.search?.trim()) {
      const search = options.search
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      const regex = new RegExp(search, "i")
      filter.$or = [{ name: regex }, { email: regex }]
    }

    const customers = await User.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "customerId",
          let: { customerId: "$_id" },
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
      },
      { $sort: { name: 1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit }
    ])

    const totalCustomers = await User.countDocuments(filter)

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

    return await User.findOneAndUpdate(
      { _id: id, role: "customer" },
      { $set: update },
      {
        new: true,
        runValidators: true
      }
    ).select("name email role status isVerified createdAt")
  }
}
export default AdminRepository
