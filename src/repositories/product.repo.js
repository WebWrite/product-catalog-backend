import Product from "../models/Product.js";


export const createProduct = async (data) => {
  return Product.create(data);
};


export const findProductsBySellerId = async (sellerId) => {
  return Product.find({ sellerId })
    .sort({ createdAt: -1 })
    .lean();
};

export const findProductById = async (productId) => {
  return Product.findById(productId).lean();
};

export const deleteProductByOwner = async (productId, sellerId) => {
  return Product.findOneAndDelete({
    _id: productId,
    sellerId,
  });
};



export const findProductsByOwner = async (productIds, sellerId) =>
  Product.find({
    _id: { $in: productIds },
    sellerId,
  })
    .select("_id image.publicId")
    .lean();

export const deleteProductsByOwner = async (productIds, sellerId) =>
  Product.deleteMany({
    _id: { $in: productIds },
    sellerId,
  });

export const updateProductStockByOwner = async (productId, sellerId, stock, currentStock) =>
  Product.findOneAndUpdate(
    { _id: productId, sellerId, stock: currentStock },
    { $set: { stock } },
    { new: true, runValidators: true }
  ).lean();


export const findProductByOwner = async (productId, sellerId) =>
  Product.findOne({ _id: productId, sellerId })
    .select("_id image")
    .lean();


export const updateProductByOwner = async (productId, sellerId, data) =>
  Product.findOneAndUpdate(
    { _id: productId, sellerId },
    { $set: data },
    { new: true, runValidators: true }
  ).lean();


export const findProductStockByOwner = async (productId, sellerId) =>
  Product.findOne({ _id: productId, sellerId }).select("_id stock").lean();

export const findAllProducts = async () =>
  Product.find({}).sort({ createdAt: -1 }).lean();

