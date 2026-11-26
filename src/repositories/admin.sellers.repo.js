import Order from "../models/Order.js"
import Product from "../models/Product.js"
import SellerProfile from "../models/seller.profile.model.js"
import User from "../models/User.js"
import bcrypt from "bcryptjs"

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
export default class AdminSellersRepository {
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

    const term = typeof search === "string" ? search.trim() : ""
    const categoryValue = typeof category === "string" ? category.trim() : ""
    const statusValue =
      status === "active" || status === "inactive" ? status : null

    const buildResult = (sellers, totalSellers) => {
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

    let categorySellerIds = null
    if (categoryValue) {
      categorySellerIds = await Product.distinct("sellerId", {
        category: categoryValue,
        isDeleted: { $ne: true }
      })
      if (categorySellerIds.length === 0) return buildResult([], 0)
    }

    let users
    let totalSellers

    if (term) {
      if (term.length < 2) return buildResult([], 0)
      const searchTerm = term.slice(0, 15).toLowerCase()

      const profileMatches = await SellerProfile.find({
        storeName: new RegExp(escapeRegex(term), "i")
      })
        .select("userId -_id")
        .limit(200)
        .lean()

      const profileUserIds = profileMatches.map((p) => p.userId)

      const filter = [{ equals: { path: "role", value: "seller" } }]
      if (statusValue) {
        filter.push({ equals: { path: "status", value: statusValue } })
      }
      if (categorySellerIds) {
        filter.push({ in: { path: "_id", value: categorySellerIds } })
      }

      const should = [
        {
          autocomplete: { path: "name", query: searchTerm, tokenOrder: "any" }
        },
        {
          autocomplete: { path: "email", query: searchTerm, tokenOrder: "any" }
        }
      ]
      if (profileUserIds.length > 0) {
        should.push({ in: { path: "_id", value: profileUserIds } })
      }

      const compound = { filter, should, minimumShouldMatch: 1 }

      const [pageUsers, meta] = await Promise.all([
        User.aggregate([
          {
            $search: {
              index: "customer_user_search",
              compound,
              sort: { createdAt: -1, _id: -1 }
            }
          },
          { $skip: skip },
          { $limit: limit },
          { $project: { name: 1, email: 1, status: 1, createdAt: 1 } }
        ]),
        User.aggregate([
          {
            $searchMeta: {
              index: "customer_user_search",
              compound,
              count: { type: "total" }
            }
          }
        ])
      ])

      users = pageUsers
      totalSellers = Number(meta[0]?.count?.total ?? 0)
    } else {
      const match = { role: "seller" }
      if (statusValue) match.status = statusValue
      if (categorySellerIds) match._id = { $in: categorySellerIds }

      const [pageUsers, count] = await Promise.all([
        User.find(match)
          .sort({ createdAt: -1, _id: -1 })
          .skip(skip)
          .limit(limit)
          .select("name email status createdAt")
          .lean(),
        User.countDocuments(match)
      ])

      users = pageUsers
      totalSellers = count
    }

    if (users.length === 0) return buildResult([], totalSellers)

    const sellerIds = users.map((user) => user._id)
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const [profiles, productCounts, monthlyStats] = await Promise.all([
      SellerProfile.find({ userId: { $in: sellerIds } })
        .select("_id storeName storeType userId")
        .lean(),

      Product.aggregate([
        { $match: { sellerId: { $in: sellerIds }, isDeleted: { $ne: true } } },
        { $group: { _id: "$sellerId", count: { $sum: 1 } } }
      ]),

      Order.aggregate([
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
            _id: { sellerId: "$items.sellerId", orderId: "$_id" },
            sales: { $sum: "$items.itemTotal" }
          }
        },
        {
          $group: {
            _id: "$_id.sellerId",
            monthlySales: { $sum: "$sales" },
            monthlyOrders: { $sum: 1 }
          }
        }
      ])
    ])

    const profileByUser = new Map(profiles.map((p) => [p.userId.toString(), p]))
    const countByUser = new Map(
      productCounts.map((p) => [p._id.toString(), p.count])
    )
    const statsByUser = new Map(monthlyStats.map((s) => [s._id.toString(), s]))

    const sellers = users.map((user) => {
      const key = user._id.toString()
      const profile = profileByUser.get(key)
      const stats = statsByUser.get(key)
      return {
        userId: user._id,
        _id: profile?._id || null,
        name: user.name,
        email: user.email,
        status: user.status,
        createdAt: user.createdAt,
        storeName: profile?.storeName || null,
        storeType: profile?.storeType || null,
        productCount: countByUser.get(key) || 0,
        monthlySales: stats?.monthlySales || 0,
        monthlyOrders: stats?.monthlyOrders || 0
      }
    })

    return buildResult(sellers, totalSellers)
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
    if (name !== undefined) userUpdate.name = name
    if (password) {
      userUpdate.password = await bcrypt.hash(password, 10)
      userUpdate.refreshToken = null
    }
    if (status !== undefined) {
      userUpdate.status = status
      if (status === "inactive") userUpdate.refreshToken = null
    }
    await User.findOneAndUpdate(
      { _id: seller.userId, role: "seller" },
      { $set: userUpdate },
      { returnDocument: "after", runValidators: true }
    ).select("name email role status isVerified createdAt")
    await SellerProfile.findByIdAndUpdate(
      id,
      { $set: { storeName, storeType } },
      { returnDocument: "after", runValidators: true }
    )
    return await this.findOneSeller(id)
  }
}
