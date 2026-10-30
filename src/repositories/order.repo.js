import { HTTP_STATUS } from "../constants/statusCodes.js"
import mongoose from "mongoose"
import Order from "../models/Order.js"
import Product from "../models/Product.js"
import StockHistory from "../models/StockHistory.js"
import AppError from "../utils/AppError.js"

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

  static findOrdersByCustomerId(customerId) {
    return Order.find({ customerId })
      .sort({ createdAt: -1 })
      .select(
        "_id customerId items shippingAddress subtotal shippingCost total paymentMethod paymentStatus createdAt"
      )
      .populate({
        path: "customerId",
        select: "name email"
      })
      .populate({
        path: "items.productId",
        select: "image.url"
      })
      .populate({
        path: "items.sellerId",
        select: "name email -_id",
        populate: {
          path: "sellerProfile",
          select: "storeName -_id"
        }
      })
      .lean()
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

  static async findOrdersBySellerId(sellerId) {
    return await Order.find({ "items.sellerId": sellerId })
      .sort({ createdAt: -1 })
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
      .lean()
      .then((orders) =>
        orders.map((order) => ({
          ...order,
          items: order.items.filter(
            (item) => item.sellerId?._id?.toString() === sellerId.toString()
          )
        }))
      )
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
