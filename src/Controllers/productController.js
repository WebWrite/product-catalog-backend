import mongoose from "mongoose"
import { ERROR_MESSAGES } from "../constants/errorMessages.js"
import { HTTP_STATUS } from "../constants/statusCodes.js"
import { SUCCESS_MESSAGES } from "../constants/successMessages.js"
import {
  bulkDeleteProductsManager,
  createProduct,
  deleteProductManager,
  getAllProductsManager,
  getProductByIdManager,
  getSellerProductsManager,
  getSellerProductStatsManager,
  updateProductManager,
  updateProductStockManager
} from "../managers/productManager.js"
import { logActivity } from "../utils/activityLog.util.js"
import AppError from "../utils/AppError.js"

export const addProduct = async (req, res) => {
  const product = await createProduct(req.body, req.user.id, req.file.buffer)

  await logActivity({
    userId: req.user.id,
    action: "PRODUCT_CREATED",
    target: "Product",
    role: req.user.role,
    message: "Seller created a product",
    requestId: req.requestId,
    metadata: { productId: product._id }
  })

  return res.status(HTTP_STATUS.CREATED).json({
    message: SUCCESS_MESSAGES.PRODUCT_CREATED,
    product
  })
}

export const getSellerProducts = async (req, res) => {
  const {category, search, sortBy = "newest",} = req.query;

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50,Math.max(1, Number(req.query.limit) || 10));

  const result = await getSellerProductsManager(req.user.id, {category,search,sortBy,page,limit,});

  const { products, total, totalPages } = result;

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: products.length
      ? SUCCESS_MESSAGES.PRODUCTS_FETCHED
      : SUCCESS_MESSAGES.PRODUCTS_EMPTY,
    data: products,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  });
};

export const getSellerProductStats = async (req, res) => {
  const stats = await getSellerProductStatsManager(req.user.id);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: stats,
  });
};


export const deleteProduct = async (req, res) => {
  const product = await deleteProductManager(req.params.id, req.user.id)

  await logActivity({
    userId: req.user.id,
    action: "PRODUCT_DELETED",
    target: "Product",
    role: req.user.role,
    message: "Seller deleted a product",
    requestId: req.requestId,
    metadata: { productId: product._id }
  })

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.PRODUCT_DELETED
  })
}

export const bulkDeleteProducts = async (req, res) => {
  const deletedCount = await bulkDeleteProductsManager(
    req.body.productIds,
    req.user.id
  )

  await logActivity({
    userId: req.user.id,
    action: "PRODUCTS_BULK_DELETED",
    target: "Product",
    role: req.user.role,
    message: "Seller deleted multiple products",
    requestId: req.requestId,
    metadata: {
      productIds: req.body.productIds,
      deletedCount
    }
  })

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.PRODUCTS_DELETED,
    deletedCount
  })
}

export const updateProductStock = async (req, res) => {
  const product = await updateProductStockManager(
    req.params.id,
    req.user.id,
    req.body.stock
  )

  await logActivity({
    userId: req.user.id,
    action: "PRODUCT_STOCK_UPDATED",
    target: "Product",
    role: req.user.role,
    message: "Seller updated product stock",
    requestId: req.requestId,
    metadata: {
      productId: product._id,
      newStock: product.stock
    }
  })

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.PRODUCT_STOCK_UPDATED,
    product
  })
}

export const updateProduct = async (req, res) => {
  if (Object.keys(req.body || {}).length === 0 && !req.file) {
    throw new AppError(ERROR_MESSAGES.INVALID_REQUEST, HTTP_STATUS.BAD_REQUEST)
  }

  const product = await updateProductManager(
    req.params.id,
    req.user.id,
    req.body,
    req.file?.buffer
  )

  await logActivity({
    userId: req.user.id,
    action: "PRODUCT_UPDATED",
    target: "Product",
    role: req.user.role,
    message: "Seller updated a product",
    requestId: req.requestId,
    metadata: { productId: product._id }
  })

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.PRODUCT_UPDATED,
    product
  })
}

export const getAllProducts = async (req, res) => {
  let {
    minPrice,
    maxPrice,
    sortBy,
    page,
    limit,
    search = "",
    category = null,
    inStock = null
  } = req.query
  page = Math.max(Number(page), 1)
  limit = Math.min(Math.max(Number(limit), 1), 15)

  let options = {
    minPrice,
    maxPrice,
    sortBy,
    page,
    limit,
    search,
    category,
    inStock
  }
  const products = await getAllProductsManager(options)
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.PRODUCTS_FETCHED,
    data: products
  })
}

export const getProductById = async (req, res) => {
  const product = await getProductByIdManager(req.params.id)

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.PRODUCT_FETCHED,
    product
  })
}
