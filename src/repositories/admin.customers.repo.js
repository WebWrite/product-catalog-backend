import Order from "../models/Order.js"
import User from "../models/User.js"
import bcrypt from "bcryptjs"

export default class AdminCustomersRepository {
  static async findCustomers(options = {}) {
    const page = Math.max(1, Number(options.page) || 1)
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 10))
    const skip = (page - 1) * limit

    const status =
      options.status && typeof options.status === "string"
        ? options.status
        : null

    const term = typeof options.search === "string" ? options.search.trim() : ""

    const buildPagination = (totalCustomers) => ({
      page,
      limit,
      totalCustomers,
      totalPages: Math.ceil(totalCustomers / limit)
    })

    const statsStages = [
      {
        $lookup: {
          from: Order.collection.name,
          localField: "_id",
          foreignField: "customerId",
          pipeline: [
            {
              $project: {
                _id: 0,
                activeItems: {
                  $filter: {
                    input: "$items",
                    as: "item",
                    cond: { $ne: ["$$item.status", "cancelled"] }
                  }
                }
              }
            },
            {
              $group: {
                _id: null,
                totalOrders: {
                  $sum: {
                    $cond: [{ $gt: [{ $size: "$activeItems" }, 0] }, 1, 0]
                  }
                },
                lifetimeSpent: { $sum: { $sum: "$activeItems.itemTotal" } }
              }
            }
          ],
          as: "stats"
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          status: 1,
          totalOrders: { $ifNull: [{ $first: "$stats.totalOrders" }, 0] },
          lifetimeSpent: { $ifNull: [{ $first: "$stats.lifetimeSpent" }, 0] }
        }
      }
    ]

    if (term) {
      if (term.length < 2) {
        return { customers: [], pagination: buildPagination(0) }
      }

      const searchTerm = term.slice(0, 15).toLowerCase()

      const filter = [{ equals: { path: "role", value: "customer" } }]
      if (status) filter.push({ equals: { path: "status", value: status } })

      const compound = {
        filter,
        should: [
          {
            autocomplete: {
              path: "name",
              query: searchTerm,
              tokenOrder: "any"
            }
          },
          {
            autocomplete: {
              path: "email",
              query: searchTerm,
              tokenOrder: "any"
            }
          }
        ],
        minimumShouldMatch: 1
      }

      const [customers, meta] = await Promise.all([
        User.aggregate([
          {
            $search: {
              index: "customer_user_search",
              compound,
              sort: { name: 1, _id: 1 }
            }
          },
          { $skip: skip },
          { $limit: limit },
          ...statsStages
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

      return {
        customers,
        pagination: buildPagination(Number(meta[0]?.count?.total ?? 0))
      }
    }

    const filter = { role: "customer" }
    if (status) filter.status = status

    const [customers, totalCustomers] = await Promise.all([
      User.aggregate([
        { $match: filter },
        { $sort: { name: 1, _id: 1 } },
        { $skip: skip },
        { $limit: limit },
        ...statsStages
      ]),
      User.countDocuments(filter)
    ])

    return { customers, pagination: buildPagination(totalCustomers) }
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
