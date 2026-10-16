import Product from "../models/Product.js"
import StockHistory from "../models/StockHistory.js"

export const createProduct = async (data) => {
  return Product.create(data)
}

export const findProductsBySellerId = (sellerId, filter, sort, cursor, limit) => {
  const query = { sellerId, ...filter };

  if (cursor) query._id = { $lt: cursor };

  return Product.find(query)
    .sort(sort)
    .limit(limit + 1)
    .lean();
};

export const findProductById = async (productId) => {
  return Product.findById(productId)
    .populate("sellerId", "name")
    .populate("seller", "storeName storeType -_id")
    .lean()
}

export const deleteProductByOwner = async (productId, sellerId) => {
  return Product.findOneAndDelete({
    _id: productId,
    sellerId
  })
}

export const findProductsByOwner = async (productIds, sellerId) =>
  Product.find({
    _id: { $in: productIds },
    sellerId
  })
    .select("_id image.publicId")
    .lean()

export const deleteProductsByOwner = async (productIds, sellerId) =>
  Product.deleteMany({
    _id: { $in: productIds },
    sellerId
  })

export const updateProductStockByOwner = async (
  productId,
  sellerId,
  stock,
  currentStock
) =>
  Product.findOneAndUpdate(
    { _id: productId, sellerId, stock: currentStock },
    { $set: { stock } },
    { new: true, runValidators: true }
  ).lean()

export const findProductByOwner = async (productId, sellerId) =>
  Product.findOne({ _id: productId, sellerId }).select("_id image stock").lean()

export const updateProductByOwner = async (productId, sellerId, data) =>
  Product.findOneAndUpdate(
    { _id: productId, sellerId },
    { $set: data },
    { new: true, runValidators: true }
  ).lean()

export const findProductStockByOwner = async (productId, sellerId) =>
  Product.findOne({ _id: productId, sellerId }).select("_id stock").lean()

export const findAllProducts = async () =>
  Product.find({})
    .sort({ createdAt: -1 })
    .populate("sellerId", "name")
    .populate("seller", "storeName storeType -_id")
    .lean()

export const createStockHistory = async (data) => {
  return StockHistory.create(data)
}
