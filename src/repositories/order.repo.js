import { HTTP_STATUS } from "../constants/statusCodes.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import StockHistory from "../models/StockHistory.js";
import AppError from "../utils/AppError.js";



export const findProductsForOrder = (productIds, session) =>
  Product.find({ _id: { $in: productIds } })
    .select("_id sellerId name price stock status sizes")
    .session(session)
    .lean();

export const decreaseStockForOrder = (productId, quantity, session) =>
  Product.findOneAndUpdate(
    {
      _id: productId,
      status: "active",
      stock: { $gte: quantity },
    },
    { $inc: { stock: -quantity } },
    {
      new: true,
      session,
      runValidators: true,
    }
  ).lean();

export const createOrderStockHistory = (entries, session) =>
  StockHistory.insertMany(entries, { session });

export const createOrder = (data, session) =>
  Order.create([data], { session });


export const findOrdersByCustomerId = (customerId) =>
  Order.find({ customerId })
    .sort({ createdAt: -1 })
    .select(
      "_id items shippingAddress subtotal shippingCost total paymentMethod paymentStatus createdAt"
    ).populate({
      path: "items.productId",
      select: "image.url",
    })
    .lean()


    export const cancelPendingOrderItem = (orderId, itemId, customerId, session) =>
  Order.findOneAndUpdate(
    {
      _id: orderId,
      customerId,
      items: {$elemMatch: {_id: itemId,status: "pending",},},
    },
    {
      $set: { "items.$.status": "cancelled" },
    },
    {
      new: true,
      session,
      runValidators: true,
    }
  )


  export const findCustomerOrder = (orderId, customerId, session) =>
  Order.findOne({ _id: orderId, customerId }).session(session)

export const restoreOrderItemStock = async (item, session) => {
  const product = await Product.findByIdAndUpdate(
    item.productId,
    { $inc: { stock: item.quantity } },
    { new: true, session, runValidators: true }
  ).lean()

  if (!product) {
    throw new AppError("Product not found while restoring cancelled item stock.",HTTP_STATUS.NOT_FOUND)
  }

  await StockHistory.create(
    [
      {
        productId: product._id,
        sellerId: item.sellerId,
        previousStock: product.stock - item.quantity,
        newStock: product.stock,
        reason: "order",
      },
    ],
    { session }
  )
}


export const findOrdersBySellerId = async (sellerId) => {
  const orders = await Order.find({ "items.sellerId": sellerId })
    .select("_id items paymentMethod paymentStatus")
     .populate({
      path: "items.productId",
      select: "image.url",
    })
    .lean();

  return orders.map((order) => ({
    ...order,
    items: order.items.filter(
      (item) => item.sellerId.toString() === sellerId.toString()
    ),
  }));
};


export const findSellerOrderItem = (orderId, itemId, sellerId, session) =>
  Order.findOne({
    _id: orderId,
    items: {
      $elemMatch: { _id: itemId, sellerId, },
    },
  }).session(session);


export const updateSellerOrderItemStatus = (orderId,itemId,sellerId,status,session) =>
  Order.findOneAndUpdate(
    {
      _id: orderId,
      items: { $elemMatch: {_id: itemId, sellerId,status: { $nin: ["delivered", "cancelled"] },},
      },
    },
    {
      $set: { "items.$.status": status },
    },
    {
      new: true,session, runValidators: true,
    }
  );