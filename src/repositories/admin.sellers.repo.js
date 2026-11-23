import Order from "../models/Order.js"
import Product from "../models/Product.js"
import SellerProfile from "../models/seller.profile.model.js"
import User from "../models/User.js"
import bcrypt from "bcryptjs"

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
        $unwind: { path: "$profile", preserveNullAndEmptyArrays: true }
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
