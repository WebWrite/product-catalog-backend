import {
  deleteProductImage,
  uploadProductImage
} from "../utils/cloudinary.util.js"
import {
  createProduct as createProductRecord,
  findProductsBySellerId,
  deleteProductByOwner,
  findProductsByOwner,
  deleteProductsByOwner,
  updateProductStockByOwner,
  updateProductByOwner,
  findProductByOwner,
  findProductStockByOwner,
  findAllProducts,
  findProductById,
  createStockHistory,
  getSellerProductStats,
  countSellerProducts,
  findProductByIds,
  searchSellerProducts
} from "../repositories/product.repo.js"
import AppError from "../utils/AppError.js"
import { HTTP_STATUS } from "../constants/statusCodes.js"
import { ERROR_MESSAGES } from "../constants/errorMessages.js"
import logger from "../config/logger.js"
import mongoose from "mongoose"

export const createProduct = async (data, sellerId, imageBuffer) => {
  const image = await uploadProductImage(imageBuffer)

  try {
    return await createProductRecord({
      ...data,
      sellerId,
      image
    })
  } catch (error) {
    try {
      await deleteProductImage(image.publicId)
    } catch (cleanupError) {
      logger.error("Failed to clean up uploaded product image", {
        publicId: image.publicId,
        error: cleanupError.message
      })
    }

    throw error
  }
}

export const getSellerProductsManager = async (sellerId, options) => {
  const {
    category,
    search,
    stockStatus,
    sortBy = "newest",
    page = 1,
    limit = 10
  } = options

  const filter = {}
  if (category) filter.category = category

  if (stockStatus === "inStock") {
    filter.stock = { $gt: 10 }
  } else if (stockStatus === "lowStock") {
    filter.stock = { $gt: 0, $lte: 10 }
  } else if (stockStatus === "deadStock") {
    filter.stock = 0
  }

  const pageNum = Math.max(1, Number(page) || 1)
  const limitNum = Math.max(1, Number(limit) || 10)
  const skip = (pageNum - 1) * limitNum
  const term = search?.trim()

  if (term && term.length >= 2) {
    const { products, total } = await searchSellerProducts(sellerId, {
      search: term,
      category,
      stockStatus,
      sortBy,
      skip,
      limit: limitNum
    })
    return { products, total, totalPages: Math.ceil(total / limitNum) }
  }

  const sortOptions = {
    newest: { _id: -1 },
    "price-low": { price: 1, _id: 1 },
    "price-high": { price: -1, _id: -1 },
    "a-z": { name: 1, _id: 1 },
    "z-a": { name: -1, _id: -1 }
  }
  const sort = sortOptions[sortBy] || sortOptions.newest

  const [products, total] = await Promise.all([
    findProductsBySellerId(sellerId, filter, sort, skip, limitNum),
    countSellerProducts(sellerId, filter)
  ])

  return { products, total, totalPages: Math.ceil(total / limitNum) }
}

export const deleteProductManager = async (productId, ownerId) => {
  const product = await deleteProductByOwner(productId, ownerId)

  if (!product) {
    throw new AppError(ERROR_MESSAGES.PRODUCT_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
  }

  return product
}

export const getSellerProductStatsManager = async (sellerId) => {
  return getSellerProductStats(sellerId)
}

export const bulkDeleteProductsManager = async (productIds, sellerId) => {
  const products = await findProductsByOwner(productIds, sellerId)

  if (products.length !== productIds.length) {
    throw new AppError(ERROR_MESSAGES.PRODUCT_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
  }

  const result = await deleteProductsByOwner(productIds, sellerId)

  return result.deletedCount
}

export const updateProductStockManager = async (productId, sellerId, stock) => {
  const currentProduct = await findProductStockByOwner(productId, sellerId)

  if (!currentProduct) {
    throw new AppError(ERROR_MESSAGES.PRODUCT_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
  }
  const previousStock = currentProduct.stock

  if (currentProduct.stock === stock) return currentProduct

  const updatedProduct = await updateProductStockByOwner(
    productId,
    sellerId,
    stock,
    previousStock
  )
  if (!updatedProduct) {
    throw new AppError(ERROR_MESSAGES.INVALID_REQUEST, HTTP_STATUS.CONFLICT)
  }
  await createStockHistory({
    productId: updatedProduct._id,
    sellerId,
    previousStock,
    newStock: updatedProduct.stock
  })

  return updatedProduct
}

const cleanupProductImage = async (publicId, productId, action) => {
  try {
    await deleteProductImage(publicId)
  } catch (error) {
    logger.error(`Failed to ${action} product image`, {
      productId,
      publicId,
      error: error.message
    })
  }
}

export const updateProductManager = async (
  productId,
  sellerId,
  data,
  imageBuffer
) => {
  const currentProduct = await findProductByOwner(productId, sellerId)

  if (!currentProduct) {
    throw new AppError(ERROR_MESSAGES.PRODUCT_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
  }

  const updateData = { ...data }
  let newImage

  const stockWasProvided = Object.hasOwn(data, "stock")
  const previousStock = currentProduct.stock
  const stockChanged = stockWasProvided && data.stock !== previousStock

  if (imageBuffer) {
    newImage = await uploadProductImage(imageBuffer)
    updateData.image = newImage
  }

  let updatedProduct

  try {
    updatedProduct = await updateProductByOwner(productId, sellerId, updateData)
  } catch (error) {
    if (newImage?.publicId) {
      await cleanupProductImage(
        newImage.publicId,
        productId,
        "clean up newly uploaded"
      )
    }

    throw error
  }

  if (!updatedProduct) {
    if (newImage?.publicId) {
      await cleanupProductImage(
        newImage.publicId,
        productId,
        "clean up newly uploaded"
      )
    }

    throw new AppError(ERROR_MESSAGES.PRODUCT_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
  }

  if (newImage && currentProduct.image?.publicId) {
    await cleanupProductImage(
      currentProduct.image.publicId,
      productId,
      "delete old"
    )
  }

  if (stockChanged) {
    await createStockHistory({
      productId: updatedProduct._id,
      sellerId,
      previousStock,
      newStock: updatedProduct.stock
    })
  }

  return updatedProduct
}

export const getAllProductsManager = async (filters) => {
  return findAllProducts(filters)
}

export const getProductByIdManager = async (productId) => {
  const product = await findProductById(productId)

  if (!product) {
    throw new AppError(ERROR_MESSAGES.PRODUCT_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
  }

  return product
}

export const getProductsByIdsManager = async (ids) => {
  const Pids = [
    ...new Set(
      (Array.isArray(ids) ? ids : String(ids ?? "").split(","))
        .map((id) => String(id).trim())
        .filter(Boolean)
    )
  ]

  if (Pids.length === 0) {
    throw new AppError(ERROR_MESSAGES.INVALID_REQUEST, HTTP_STATUS.BAD_REQUEST)
  }

  if (Pids.length > 50) {
    throw new AppError(ERROR_MESSAGES.FETCH_LIMIT, HTTP_STATUS.BAD_REQUEST)
  }

  const validIds = Pids.filter((id) => mongoose.isValidObjectId(id))

  if (validIds.length === 0) {
    throw new AppError(
      ERROR_MESSAGES.INVALID_OBJECT_ID,
      HTTP_STATUS.BAD_REQUEST
    )
  }
  return findProductByIds(validIds)
}
