import Order from "../models/Order.js"
import User from "../models/User.js"
import bcrypt from "bcryptjs"

export default class AdminCustomersRepository {
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
    if (update.status === "inactive") update.refreshToken = null

    return await User.findOneAndUpdate(
      { _id: id, role: "customer" },
      { $set: update },
      { returnDocument: "after", runValidators: true }
    ).select("name email role status isVerified createdAt")
  }
}
