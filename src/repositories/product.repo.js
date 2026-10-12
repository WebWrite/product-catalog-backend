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
  return Product.findById(productId);
};

export const deleteProductByOwner = async (productId, sellerId) => {
  return Product.findOneAndDelete({
    _id: productId,
    sellerId,
  });
};