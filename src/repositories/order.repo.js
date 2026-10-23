import { HTTP_STATUS } from "../constants/statusCodes.js"
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
        "_id items shippingAddress subtotal shippingCost total paymentMethod paymentStatus createdAt"
      )
      .populate({
        path: "items.productId",
        select: "image.url"
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
    const orders = await Order.find({ "items.sellerId": sellerId })
      .select("_id items paymentMethod paymentStatus")
      .populate({
        path: "items.productId",
        select: "image.url"
      })
      .lean()

    return orders.map((order) => ({
      ...order,
      items: order.items.filter(
        (item) => item.sellerId.toString() === sellerId.toString()
      )
    }))
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

  static updateOrderPaymentStatus(orderId, paymentStatus) {
    return Order.findOneAndUpdate(
      { _id: orderId, paymentMethod: "STRIPE" },
      { $set: { paymentStatus } },
      { new: true, runValidators: true }
    )
  }
}

export default OrderRepository
