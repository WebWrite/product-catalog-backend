import { HTTP_STATUS } from "../constants/statusCodes.js"
import mongoose from "mongoose"
import Order from "../models/Order.js"
import Product from "../models/Product.js"
import StockHistory from "../models/StockHistory.js"
import AppError from "../utils/AppError.js"
import User from "../models/User.js"
import SellerProfile from "../models/seller.profile.model.js"
class OrderRepository {
  static findProductsForOrder(productIds, session) {
    return Product.find({ _id: { $in: productIds } })
      .select("_id sellerId name price stock status sizes")
      .session(session)
      .lean()
  }
  static decreaseStockForOrder(productId, quantity, session) {
    return Product.findOneAndUpdate(
      {
        _id: productId,
        status: "active",
        stock: { $gte: quantity }
      },
      { $inc: { stock: -quantity } },
      {
        new: true,
        session,
        runValidators: true
      }
    ).lean()
  }

  static createOrderStockHistory(entries, session) {
    return StockHistory.insertMany(entries, { session })
  }

  static createOrder(data, session) {
    return Order.create([data], { session })
  }

  static async findOrdersByCustomerId(customerId, filters) {
    const { page, limit, search, paymentMethod, paymentStatus } = filters

    const query = { customerId }

    if (paymentMethod) query.paymentMethod = paymentMethod
    if (paymentStatus) query.paymentStatus = paymentStatus

    if (search) {
      const regex = new RegExp(search, "i")

      const sellers = await SellerProfile.find({
        storeName: regex
      })
        .select("userId")
        .lean()

      const sellerIds = sellers.map((seller) => seller.userId)

      query.$or = [
        { "items.name": regex },
        { "items.sellerId": { $in: sellerIds } }
      ]
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select(
          "_id customerId items shippingAddress subtotal shippingCost total paymentMethod paymentStatus createdAt"
        )
        .populate({ path: "customerId", select: "name email" })
        .populate({ path: "items.productId", select: "image.url" })
        .populate({
          path: "items.sellerId",
          select: "name email -_id",
          populate: {
            path: "sellerProfile",
            select: "storeName -_id"
          }
        })
        .lean(),

      Order.countDocuments(query)
    ])

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
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
        new: true,
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
      { new: true, session, runValidators: true }
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
                  $in: ["delivered", "pending", "confirmed"]
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
        new: true,
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

    const update = { $set: updates }

    if (paymentStatus === "completed") {
      update.$unset = { paymentExpiresAt: 1 }
    }

    return Order.findOneAndUpdate(
      {
        _id: orderId,
        paymentStatus: "pending"
      },
      update,
      {
        new: true,
        runValidators: true,
        session
      }
    )
  }

  static getSellerSalesStats(sellerId) {
    const sellerObjectId = new mongoose.Types.ObjectId(sellerId)

    return Order.aggregate([
      {
        $match: {
          "items.sellerId": sellerObjectId,
          paymentStatus: { $ne: "failed" }
        }
      },
      { $unwind: "$items" },
      {
        $match: {
          "items.sellerId": sellerObjectId,
          "items.status": { $ne: "cancelled" }
        }
      },
      {
        $group: {
          _id: "$_id",
          sales: { $sum: "$items.itemTotal" }
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSales: { $sum: "$sales" }
        }
      }
    ])
  }

  static getSellerMonthlySales(sellerId, startDate, endDate) {
    const sellerObjectId = new mongoose.Types.ObjectId(sellerId)

    return Order.aggregate([
      {
        $match: {
          "items.sellerId": sellerObjectId,
          paymentStatus: { $ne: "failed" },
          createdAt: { $gte: startDate, $lt: endDate }
        }
      },
      { $unwind: "$items" },
      {
        $match: {
          "items.sellerId": sellerObjectId,
          "items.status": { $ne: "cancelled" }
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
}

export default OrderRepository
