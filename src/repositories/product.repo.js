import Product from "../models/Product.js"
import StockHistory from "../models/StockHistory.js"
import mongoose from "mongoose"
import User from "../models/User.js"

export const createProduct = async (data) => {
  return Product.create(data)
}

export const findProductsBySellerId = (sellerId, filter, sort, skip, limit) =>
  Product.find({ sellerId, isDeleted: false, ...filter })
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean()

export const countSellerProducts = (sellerId, filter) =>
  Product.countDocuments({ sellerId, isDeleted: false, ...filter })

export const searchSellerProducts = async (
  sellerId,
  { search, category, stockStatus, sortBy, skip, limit }
) => {
  const filters = [
    {
      equals: { path: "sellerId", value: new mongoose.Types.ObjectId(sellerId) }
    },
    { equals: { path: "isDeleted", value: false } }
  ]

  if (category) filters.push({ equals: { path: "category", value: category } })

  if (stockStatus === "inStock") {
    filters.push({ range: { path: "stock", gt: 10 } })
  } else if (stockStatus === "lowStock") {
    filters.push({ range: { path: "stock", gt: 0, lte: 10 } })
  } else if (stockStatus === "deadStock") {
    filters.push({ range: { path: "stock", gte: 0, lte: 0 } })
  }

  const compound = {
    filter: filters,
    must: [{ autocomplete: { query: search, path: "name" } }]
  }

  const sortMap = {
    newest: { createdAt: -1 },
    "price-low": { price: 1 },
    "price-high": { price: -1 },
    "a-z": { name: 1 },
    "z-a": { name: -1 }
  }
  const sort = sortMap[sortBy] || sortMap.newest

  const [products, meta] = await Promise.all([
    Product.aggregate([
      { $search: { index: "default", compound, sort } },
      { $skip: skip },
      { $limit: limit },
      { $project: { description: 0 } }
    ]),
    Product.aggregate([
      {
        $searchMeta: {
          index: "default",
          compound,
          count: { type: "total" }
        }
      }
    ])
  ])

  return { products, total: meta[0]?.count?.total ?? 0 }
}
export const getSellerProductStats = async (sellerId) => {
  const [totalProducts, activeProducts, lowStockProducts, deadStockProducts] =
    await Promise.all([
      Product.countDocuments({ sellerId }),
      Product.countDocuments({ sellerId, status: "active" }),
      Product.countDocuments({
        sellerId,
        stock: { $gt: 0, $lte: 10 }
      }),
      Product.countDocuments({
        sellerId,
        stock: 0
      })
    ])

  return {
    totalProducts,
    activeProducts,
    lowStockProducts,
    deadStockProducts
  }
}

export const getSellerInventoryHealth = async (sellerId) => {
  const sellerObjectId = new mongoose.Types.ObjectId(sellerId)
  const [stats] = await Product.aggregate([
    { $match: { sellerId: sellerObjectId } },
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        healthyStock: {
          $sum: { $cond: [{ $gt: ["$stock", 5] }, 1, 0] }
        },
        lowStock: {
          $sum: {
            $cond: [
              { $and: [{ $gt: ["$stock", 0] }, { $lte: ["$stock", 5] }] },
              1,
              0
            ]
          }
        },
        soldOut: {
          $sum: { $cond: [{ $eq: ["$stock", 0] }, 1, 0] }
        }
      }
    }
  ])

  const totalProducts = stats?.totalProducts || 0
  const percentage = (count) =>
    totalProducts ? Number(((count / totalProducts) * 100).toFixed(2)) : 0

  return {
    totalProducts,
    healthyStock: {
      count: stats?.healthyStock || 0,
      percentage: percentage(stats?.healthyStock || 0)
    },
    lowStock: {
      count: stats?.lowStock || 0,
      percentage: percentage(stats?.lowStock || 0)
    },

    soldOut: {
      count: stats?.soldOut || 0,
      percentage: percentage(stats?.soldOut || 0)
    }
  }
}

export const findProductById = async (productId) => {
  return Product.findById(productId)
    .populate("sellerId", "name")
    .populate("seller", "storeName storeType -_id")
    .lean()
}

export const findProductByIds = async (ids) => {
  return Product.find({ _id: { $in: ids } })
    .populate("sellerId", "name")
    .populate("seller", "storeName storeType -_id")
    .lean()
}

export const deleteProductByOwner = async (productId, sellerId) => {
  return Product.findOneAndUpdate(
    {
      _id: productId,
      sellerId
    },
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date()
      }
    },
    { returnDocument: "after", runValidators: true }
  )
}

export const findProductsByOwner = async (productIds, sellerId) =>
  Product.find({
    _id: { $in: productIds },
    sellerId
  })
    .select("_id image.publicId")
    .lean()

export const deleteProductsByOwner = async (productIds, sellerId) =>
  Product.updateMany(
    {
      _id: { $in: productIds },
      sellerId
    },
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date()
      }
    },
    { runValidators: true }
  )

export const updateProductStockByOwner = async (
  productId,
  sellerId,
  stock,
  currentStock
) =>
  Product.findOneAndUpdate(
    { _id: productId, sellerId, stock: currentStock },
    { $set: { stock } },
    { returnDocument: "after", runValidators: true }
  ).lean()

export const findProductByOwner = async (productId, sellerId) =>
  Product.findOne({ _id: productId, sellerId }).select("_id image stock").lean()

export const updateProductByOwner = async (productId, sellerId, data) =>
  Product.findOneAndUpdate(
    { _id: productId, sellerId },
    { $set: data },
    { returnDocument: "after", runValidators: true }
  ).lean()

export const findProductStockByOwner = async (productId, sellerId) =>
  Product.findOne({ _id: productId, sellerId }).select("_id stock").lean()

export const findAllProducts = async (options) => {
  const search = options.search?.trim()
  const hasSearch = Boolean(search && search.length >= 2)

  const currentPage = Math.max(1, Number(options.page) || 1)
  const pageLimit = Math.max(1, Number(options.limit) || 15)
  const skip = (currentPage - 1) * pageLimit

  const sortOptions = {
    "high-to-low": { price: -1 },
    "low-to-high": { price: 1 }
  }
  const sort = sortOptions[options.sortBy] || { createdAt: -1 }

  if (!hasSearch) {
    const filter = { status: "active", isDeleted: false }

    if (options.category) filter.category = options.category

    if (options.minPrice != null || options.maxPrice != null) {
      filter.price = {}
      if (options.minPrice != null) filter.price.$gte = Number(options.minPrice)
      if (options.maxPrice != null) filter.price.$lte = Number(options.maxPrice)
    }

    if (options.inStock === true || options.inStock === "true") {
      filter.stock = { $gte: 1 }
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .select("-description")
        .sort(sort)
        .skip(skip)
        .limit(pageLimit)
        .populate("sellerId", "name")
        .populate("seller", "storeName storeType -_id")
        .lean(),
      Product.countDocuments(filter)
    ])

    return {
      products,
      total,
      page: currentPage,
      limit: pageLimit,
      totalPages: Math.ceil(total / pageLimit)
    }
  }

  const filters = [
    { equals: { path: "status", value: "active" } },
    { equals: { path: "isDeleted", value: false } }
  ]

  if (options.category) {
    filters.push({ equals: { path: "category", value: options.category } })
  }

  if (options.minPrice != null || options.maxPrice != null) {
    const range = { path: "price" }
    if (options.minPrice != null) range.gte = Number(options.minPrice)
    if (options.maxPrice != null) range.lte = Number(options.maxPrice)
    filters.push({ range })
  }

  if (options.inStock === true || options.inStock === "true") {
    filters.push({ range: { path: "stock", gte: 1 } })
  }

  const compound = {
    filter: filters,
    must: [{ autocomplete: { query: search, path: "name" } }]
  }

  const [products, meta] = await Promise.all([
    Product.aggregate([
      { $search: { index: "default", compound, sort } },
      { $skip: skip },
      { $limit: pageLimit },
      { $project: { description: 0 } }
    ]),
    Product.aggregate([
      {
        $searchMeta: {
          index: "default",
          compound,
          count: { type: "lowerBound" }
        }
      }
    ])
  ])

  const total = meta[0]?.count?.lowerBound ?? 0

  await Product.populate(products, [
    { path: "sellerId", select: "name" },
    { path: "seller", select: "storeName storeType -_id" }
  ])

  return {
    products,
    total,
    page: currentPage,
    limit: pageLimit,
    totalPages: Math.ceil(total / pageLimit)
  }
}

export const createStockHistory = async (data) => {
  return StockHistory.create(data)
}

export const findSellerProfileByUserId = (userId) =>
  User.findById(userId)
    .select("name email role createdAt")
    .populate({
      path: "sellerProfile",
      select: "storeName storeType userId"
    })
    .lean()
