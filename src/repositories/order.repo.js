import { HTTP_STATUS } from "../constants/statusCodes.js"
import mongoose from "mongoose"
import Order from "../models/Order.js"
import Product from "../models/Product.js"
import StockHistory from "../models/StockHistory.js"
import AppError from "../utils/AppError.js"
import User from "../models/User.js"
import SellerProfile from "../models/seller.profile.model.js"

const ORDER_SUBSTRING_SEARCH_INDEX = "customer_order_substring_search"
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

const ORDER_LIST_FIELDS =
  "_id customerId items shippingAddress subtotal shippingCost total paymentMethod paymentStatus createdAt"

const populateOrderList = (query) =>
  query
    .populate({ path: "customerId", select: "name email" })
    .populate({ path: "items.productId", select: "image.url" })
    .populate({
      path: "items.sellerId",
      select: "name email -_id",
      populate: { path: "sellerProfile", select: "storeName -_id" }
    })

class OrderRepository {
  static findProductsForOrder(productIds, session) {
    return Product.find({ _id: { $in: productIds } })
      .select("_id sellerId name price stock status sizes")
      .session(session)
      .lean()
  }
  static decreaseStockForOrder(operations, session) {
    return Product.bulkWrite(operations, { session })
  }

  static createOrderStockHistory(entries, session) {
    return StockHistory.insertMany(entries, { session })
  }

  static createOrder(data, session) {
    return Order.create([data], { session })
  }

  static buildOrderPagination(page, limit, total) {
    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }

  static async findOrdersByCustomerId(customerId, filters) {
    const { page, limit, search, paymentMethod, paymentStatus } = filters
    const currentPage = Math.max(1, Number(page) || 1)
    const pageSize = Math.min(50, Math.max(1, Number(limit) || 10))
    const skip = (currentPage - 1) * pageSize
    const term = typeof search === "string" ? search.trim() : ""

    if (term.length >= 2) {
      return this.findSearchedOrdersByCustomerId(customerId, {
        term,
        paymentMethod,
        paymentStatus,
        page: currentPage,
        limit: pageSize,
        skip
      })
    }

    const query = { customerId }
    if (paymentMethod) query.paymentMethod = paymentMethod
    if (paymentStatus) query.paymentStatus = paymentStatus

    const [orders, total] = await Promise.all([
      populateOrderList(
        Order.find(query)
          .sort({ createdAt: -1, _id: -1 })
          .skip(skip)
          .limit(pageSize)
          .select(ORDER_LIST_FIELDS)
      ).lean(),
      Order.countDocuments(query)
    ])

    return {
      orders,
      pagination: this.buildOrderPagination(currentPage, pageSize, total)
    }
  }

  static async findSearchedOrdersByCustomerId(customerId, filters) {
    const { term, paymentMethod, paymentStatus, page, limit, skip } = filters
    const searchTerm = term.slice(0, 15).toLowerCase()

    const sellers = await SellerProfile.find({
      storeName: new RegExp(escapeRegex(term), "i")
    })
      .select("userId")
      .limit(200)
      .lean()

    const should = [
      {
        embeddedDocument: {
          path: "items",
          operator: {
            autocomplete: {
              path: "items.name",
              query: searchTerm,
              tokenOrder: "any"
            }
          }
        }
      }
    ]

    if (sellers.length > 0) {
      should.push({
        embeddedDocument: {
          path: "items",
          operator: {
            in: {
              path: "items.sellerId",
              value: sellers.map((seller) => seller.userId)
            }
          }
        }
      })
    }

    const filter = [
      {
        equals: {
          path: "customerId",
          value: new mongoose.Types.ObjectId(customerId)
        }
      }
    ]

    if (paymentMethod) {
      filter.push({ equals: { path: "paymentMethod", value: paymentMethod } })
    }
    if (paymentStatus) {
      filter.push({ equals: { path: "paymentStatus", value: paymentStatus } })
    }

    const compound = { filter, should, minimumShouldMatch: 1 }
    const [pageDocs, metaDocs] = await Promise.all([
      Order.aggregate([
        {
          $search: {
            index: ORDER_SUBSTRING_SEARCH_INDEX,
            compound,
            sort: { createdAt: -1, _id: -1 }
          }
        },
        { $skip: skip },
        { $limit: limit },
        { $project: { _id: 1 } }
      ]),
      Order.aggregate([
        {
          $searchMeta: {
            index: ORDER_SUBSTRING_SEARCH_INDEX,
            compound,
            count: { type: "total" }
          }
        }
      ])
    ])

    const total = Number(metaDocs[0]?.count?.total ?? 0)
    const orderIds = pageDocs.map((order) => order._id)

    if (orderIds.length === 0) {
      return {
        orders: [],
        pagination: this.buildOrderPagination(page, limit, total)
      }
    }

    const populatedOrders = await populateOrderList(
      Order.find({ _id: { $in: orderIds } }).select(ORDER_LIST_FIELDS)
    ).lean()
    const ordersById = new Map(
      populatedOrders.map((order) => [order._id.toString(), order])
    )
    const orders = orderIds
      .map((id) => ordersById.get(id.toString()))
      .filter(Boolean)

    return {
      orders,
      pagination: this.buildOrderPagination(page, limit, total)
    }
  }

  static findByIdempotencyKey(customerId, idempotencyKey) {
    return Order.findOne({
      customerId,
      idempotencyKey
    }).lean()
  }

  static cancelPendingOrderItem(orderId, itemId, customerId, session) {
    return Order.findOneAndUpdate(
      {
        _id: orderId,
        customerId,
        items: { $elemMatch: { _id: itemId, status: "pending" } }
      },
      {
        $set: { "items.$.status": "cancelled" }
      },
      {
        returnDocument: "after",
        session,
        runValidators: true
      }
    )
  }

  static findCustomerOrder(orderId, customerId, session) {
    return Order.findOne({ _id: orderId, customerId }).session(session)
  }

  static async restoreOrderItemStock(item, session) {
    const product = await Product.findByIdAndUpdate(
      item.productId,
      { $inc: { stock: item.quantity } },
      { returnDocument: "after", session, runValidators: true }
    ).lean()

    if (!product) {
      throw new AppError(
        "Product not found while restoring cancelled item stock.",
        HTTP_STATUS.NOT_FOUND
      )
    }

    await StockHistory.create(
      [
        {
          productId: product._id,
          sellerId: item.sellerId,
          previousStock: product.stock - item.quantity,
          newStock: product.stock,
          reason: "order"
        }
      ],
      { session }
    )
  }
  static async orderStats(sellerId) {
    const sellerObjectId = new mongoose.Types.ObjectId(sellerId)
    const stats = await Order.aggregate([
      {
        $match: {
          "items.sellerId": sellerObjectId
        }
      },
      {
        $facet: {
          totalOrders: [{ $count: "count" }],
          processingItems: [
            { $unwind: "$items" },
            {
              $match: {
                "items.sellerId": sellerObjectId,
                "items.status": {
                  $in: ["pending", "confirmed"]
                }
              }
            },
            {
              $count: "count"
            }
          ],
          deliveredItems: [
            { $unwind: "$items" },
            {
              $match: {
                "items.sellerId": sellerObjectId,
                "items.status": "delivered"
              }
            },
            { $count: "count" }
          ],
          totalSales: [
            { $unwind: "$items" },
            {
              $match: {
                "items.sellerId": sellerObjectId,
                "items.status": {
                  $in: ["delivered", "confirmed"]
                }
              }
            },
            {
              $group: {
                _id: null,
                total: {
                  $sum: "$items.itemTotal"
                }
              }
            }
          ]
        }
      }
    ])
    return {
      totalOrders: stats[0].totalOrders[0]?.count || 0,
      processingItems: stats[0].processingItems[0]?.count || 0,
      deliveredItems: stats[0].deliveredItems[0]?.count || 0,
      totalSales: stats[0].totalSales[0]?.total || 0
    }
  }

  static async findOrdersBySellerId(sellerId, filters) {
    const { page, limit, search, paymentMethod, paymentStatus } = filters

    const query = {
      "items.sellerId": sellerId
    }

    if (paymentMethod) {
      query.paymentMethod = paymentMethod
    }

    if (paymentStatus) {
      query.paymentStatus = paymentStatus
    }

    if (search) {
      const customers = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } }
        ]
      }).select("_id")

      query.customerId = {
        $in: customers.map((user) => user._id)
      }
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select(
          "_id customerId items shippingAddress subtotal shippingCost total paymentMethod paymentStatus createdAt"
        )
        .populate({
          path: "customerId",
          select: "name email _id"
        })
        .populate({
          path: "items.productId",
          select: "image.url"
        })
        .populate({
          path: "items.sellerId",
          select: "name email",
          populate: {
            path: "sellerProfile",
            select: "storeName -_id"
          }
        })
        .lean(),

      Order.countDocuments(query)
    ])

    const sellerOrders = orders.map((order) => ({
      ...order,
      items: order.items.filter(
        (item) => item.sellerId?._id?.toString() === sellerId.toString()
      )
    }))

    return {
      orders: sellerOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  static findSellerOrderItem(orderId, itemId, sellerId, session) {
    return Order.findOne({
      _id: orderId,
      items: {
        $elemMatch: { _id: itemId, sellerId }
      }
    }).session(session)
  }

  static updateSellerOrderItemStatus(
    orderId,
    itemId,
    sellerId,
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
            sellerId,
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

  static updateOrderPaymentStatus(orderId, paymentStatus, session) {
    const updates = { paymentStatus }

    if (paymentStatus === "completed") {
      updates["items.$[].status"] = "confirmed"
    }

    return Order.findOneAndUpdate(
      {
        _id: orderId,
        paymentStatus: "pending"
      },
      {
        $set: updates,
        ...(paymentStatus === "completed" && {
          $unset: { paymentExpiresAt: 1 }
        })
      },
      {
        returnDocument: "after",
        runValidators: true,
        session
      }
    )
  }

  static async getSellerSalesStats(sellerId) {
    const sellerObjectId = new mongoose.Types.ObjectId(sellerId)

    const [stats] = await Order.aggregate([
      {
        $match: {
          "items.sellerId": sellerObjectId
        }
      },
      {
        $facet: {
          totalOrders: [{ $count: "count" }],
          totalSales: [
            { $unwind: "$items" },
            {
              $match: {
                "items.sellerId": sellerObjectId,
                "items.status": { $in: ["confirmed", "delivered"] }
              }
            },
            {
              $group: {
                _id: null,
                total: { $sum: "$items.itemTotal" }
              }
            }
          ]
        }
      }
    ])

    const result = {
      totalOrders: stats?.totalOrders[0]?.count ?? 0,
      totalSales: stats?.totalSales[0]?.total ?? 0
    }

    return [result]
  }
  static getSellerMonthlySales(sellerId, startDate, endDate) {
    const sellerObjectId = new mongoose.Types.ObjectId(sellerId)

    return Order.aggregate([
      {
        $match: {
          "items.sellerId": sellerObjectId,
          paymentStatus: { $in: ["pending", "completed"] },
          createdAt: { $gte: startDate, $lt: endDate }
        }
      },
      { $unwind: "$items" },
      {
        $match: {
          "items.sellerId": sellerObjectId,
          "items.status": { $in: ["confirmed", "delivered"] }
        }
      },
      {
        $group: {
          _id: {
            orderId: "$_id",
            year: { $year: { date: "$createdAt", timezone: "UTC" } },
            month: { $month: { date: "$createdAt", timezone: "UTC" } }
          },
          sales: { $sum: "$items.itemTotal" }
        }
      },
      {
        $group: {
          _id: { year: "$_id.year", month: "$_id.month" },
          orders: { $sum: 1 },
          sales: { $sum: "$sales" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ])
  }

  static findOrderById(orderId, session) {
    return Order.findById(orderId).session(session ?? null)
  }

  static markOrderRefundPending(orderId, session) {
    return Order.findOneAndUpdate(
      {
        _id: orderId,
        paymentStatus: { $in: ["pending", "completed"] }
      },
      {
        $set: { paymentStatus: "refund_pending" },
        $unset: { paymentExpiresAt: 1 }
      },
      {
        returnDocument: "after",
        runValidators: true,
        session
      }
    )
  }

  static updateOrderForPaymentRetry(orderId, paymentExpiresAt) {
    return Order.findOneAndUpdate(
      {
        _id: orderId,
        paymentStatus: { $in: ["pending", "failed"] }
      },
      {
        $set: {
          paymentStatus: "pending",
          paymentExpiresAt
        }
      },
      {
        returnDocument: "after",
        runValidators: true
      }
    )
  }
  static updateOrderRefundStatus(orderId, paymentStatus) {
    return Order.findOneAndUpdate(
      { _id: orderId, paymentStatus: "refund_pending" },
      { $set: { paymentStatus } },
      {
        returnDocument: "after",
        runValidators: true
      }
    )
  }
}

export default OrderRepository
