import { HTTP_STATUS } from "../constants/statusCodes.js";
import { SUCCESS_MESSAGES } from "../constants/successMessages.js";
import { createProduct, deleteProductManager, getSellerProductsManager } from "../managers/productManager.js";
import { findProductById } from "../repositories/product.repo.js";
import AppError from "../utils/AppError.js";

export const addProduct = async (req, res, next) => {
    try {
        const product = await createProduct(
            req.body,
            req.user._id,
            req.file.buffer
        );

        return res.status(HTTP_STATUS.CREATED).json({
            message: SUCCESS_MESSAGES.PRODUCT_CREATED,
            product,
        });
    } catch (error) {
        next(error);
    }
};



export const getSellerProducts = async (req, res) => {
    const products = await getSellerProductsManager(req.user._id);

    return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: products.length
            ? SUCCESS_MESSAGES.PRODUCTS_FETCHED
            : SUCCESS_MESSAGES.PRODUCTS_EMPTY,
        count: products.length,
        data: products,
    });
};



export const deleteProduct = async (req, res) => {
  const product = await findProductById(req.params.id);

  if (!product) {
    throw new AppError(
      ERROR_MESSAGES.PRODUCT_NOT_FOUND,
      HTTP_STATUS.NOT_FOUND
    );
  }

  if (product.sellerId.toString() !== req.user._id.toString()) {
    throw new AppError(
      ERROR_MESSAGES.PRODUCT_OWNERSHIP_REQUIRED,
      HTTP_STATUS.FORBIDDEN
    );
  }

  await deleteProductManager(product._id, req.user._id);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.PRODUCT_DELETED,
  });
};