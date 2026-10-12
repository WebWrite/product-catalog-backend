import { deleteProductImage, uploadProductImage } from "../utils/cloudinary.util.js";
import { createProduct as createProductRecord, findProductsBySellerId ,deleteProductByOwner} from "../repositories/product.repo.js";
import { compressProductImage } from "../utils/compress-image.js";

export const createProduct = async (data, sellerId, imageBuffer) => {

  const compressedBuffer = await compressProductImage(imageBuffer);

  const image = await uploadProductImage(compressedBuffer);

  try {
    return await createProductRecord({
      ...data,
      sellerId,
      image,
    });
  } catch (error) {
    try {
      await deleteProductImage(image.publicId);
    } catch (cleanupError) {
      console.error("Failed to clean up uploaded product image:", {
        publicId: image.publicId,
        error: cleanupError.message,
      });
    }

    throw error;
  }
};


export const getSellerProductsManager = async (sellerId) => {
  return findProductsBySellerId(sellerId);
};

export const deleteProductManager = async (productId, ownerId) => {
  const product = await deleteProductByOwner(productId, ownerId);

  if (!product) {
    throw new AppError(
      ERROR_MESSAGES.PRODUCT_NOT_FOUND,
      HTTP_STATUS.NOT_FOUND
    );
  }
 if (product.image?.publicId) {
    try {
      await deleteProductImage(product.image.publicId);
    } catch (cleanupError) {
      console.error("Failed to clean up deleted product image:", {
        productId: product._id.toString(),
        publicId: product.image.publicId,
        error: cleanupError.message,
      });
    }
  }
  return product;
};