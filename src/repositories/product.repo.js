import Product from "../models/Product.js"
import StockHistory from "../models/StockHistory.js"

export const createProduct = async (data) => {
  return Product.create(data)
}

export const findProductsBySellerId = (sellerId, filter,sort,skip,limit) => {
  return Product.find({ sellerId, ...filter })
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();
};
export const countSellerProducts = (sellerId, filter) => {
  return Product.countDocuments({ sellerId, ...filter });
};
export const getSellerProductStats = async (sellerId) => {
  const [totalProducts, activeProducts] = await Promise.all([
    Product.countDocuments({ sellerId }),
    Product.countDocuments({ sellerId, status: "active" }),
  ]);

  return { totalProducts, activeProducts };
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

export const findAllProducts = async (options) => {
  const filter = {}
  if (options.minPrice != null || options.maxPrice != null) {
    filter.price = {}
    if (options.minPrice != null) {
      filter.price.$gte = Number(options.minPrice)
    }

    if (options.maxPrice != null) {
      filter.price.$lte = Number(options.maxPrice)
    }
  }

  if (options.search?.trim()) {
    filter.name = {
      $regex: options.search.trim(),
      $options: "i"
    }
  }
  if (options.category) {
    filter.category = options.category
  }

  if (options.inStock === true || options.inStock === "true") {
    filter.stock = {
      $gte: 1
    }
  }

  const sortOptions = {
    "high-to-low": { price: -1 },
    "low-to-high": { price: 1 }
  }

  const sort = sortOptions[options.sortBy] || { createdAt: -1 }

  const currentPage = Math.max(1, Number(options.page) || 1)
  const pageLimit = Math.max(1, Number(options.limit) || 15)
  const skip = (currentPage - 1) * pageLimit

  Product.find({})
    .sort({ createdAt: -1 })
    .populate("sellerId", "name")
    .populate("seller", "storeName storeType -_id")
    .lean()

  const [products, total] = await Promise.all([
    Product.find(filter)
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

export const createStockHistory = async (data) => {
  return StockHistory.create(data)
}
