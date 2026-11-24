import fillMissingDays from "../helpers/fillMissingDays.js"
import Order from "../models/Order.js"
import User from "../models/User.js"
import ActivityLog from "../models/AcitivtyLog.js"

export default class AdminDashboardRepository {
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
    const result = await Order.aggregate([
      { $unwind: "$items" },
      { $match: { "items.status": { $in: ["confirmed", "delivered"] } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$items.itemTotal" }
        }
      }
    ])
    return result[0]?.totalRevenue ?? 0
  }

  static async countOrder() {
    return await Order.countDocuments()
  }

  static async countSellers() {
    return await User.countDocuments({ role: "seller", status: "active" })
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
                createdAt: { $gte: previousMonthStart, $lt: currentMonthStart }
              }
            },
            { $group: { _id: null, subtotal: { $sum: "$subtotal" } } }
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
        { $group: { _id: null, gmv: { $sum: "$items.itemTotal" } } }
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
}
