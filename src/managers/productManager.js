import {
  deleteProductImage,
  deleteProductImages,
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
  countSellerProducts
} from "../repositories/product.repo.js"
import { compressProductImage } from "../utils/compress-image.js"
import AppError from "../utils/AppError.js"
import { HTTP_STATUS } from "../constants/statusCodes.js"
import { ERROR_MESSAGES } from "../constants/errorMessages.js"
import logger from "../config/logger.js"

export const createProduct = async (data, sellerId, imageBuffer) => {
  const compressedBuffer = await compressProductImage(imageBuffer)

  const image = await uploadProductImage(compressedBuffer)

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
  const {category, search,sortBy = "newest",page,limit,} = options;

  const filter = {};

  if (category) filter.category = category;

  if (search?.trim()) {
    filter.name = {
      $regex: search.trim(),
      $options: "i",
    };
  }

  const sortOptions = {
    newest: { _id: -1 },
    "price-low": { price: 1, _id: 1 },
    "price-high": { price: -1, _id: -1 },
    "a-z": { name: 1, _id: 1 },
    "z-a": { name: -1, _id: -1 },
  };

  const sort = sortOptions[sortBy] || sortOptions.newest;
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    findProductsBySellerId(sellerId,  filter,sort,skip,limit ),
    countSellerProducts(sellerId, filter),
  ]);

  return { products, total };
};


export const deleteProductManager = async (productId, ownerId) => {
  const product = await deleteProductByOwner(productId, ownerId)

  if (!product) {
    throw new AppError(ERROR_MESSAGES.PRODUCT_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
  }
  if (product.image?.publicId) {
    try {
      await deleteProductImage(product.image.publicId)
    } catch (cleanupError) {
      logger.error("Failed to clean up deleted product image", {
        productId: product._id.toString(),
        publicId: product.image.publicId,
        error: cleanupError.message
      })
    }
  }
  return product
}

export const bulkDeleteProductsManager = async (productIds, sellerId) => {
  const products = await findProductsByOwner(productIds, sellerId)

  if (products.length !== productIds.length) {
    throw new AppError(ERROR_MESSAGES.PRODUCT_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
  }

  const result = await deleteProductsByOwner(productIds, sellerId)

  const publicIds = products
    .map((product) => product.image?.publicId)
    .filter(Boolean)

  try {
    await deleteProductImages(publicIds)
  } catch (error) {
    logger.error("Bulk product image cleanup failed", {
      productIds,
      error: error.message
    })
  }

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
    const compressedBuffer = await compressProductImage(imageBuffer)
    newImage = await uploadProductImage(compressedBuffer)
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
