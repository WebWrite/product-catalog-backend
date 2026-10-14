import { ERROR_MESSAGES } from "../constants/errorMessages.js"
import { HTTP_STATUS } from "../constants/statusCodes.js"
import Product from "../models/Product.js"
import AppError from "../utils/AppError.js"

export const adjustStock = async (productId, quantity) => {
  const product = await Product.findOneAndUpdate(
    { _id: productId, status: "active", stock: { $gte: quantity } },
    { $inc: { stock: -quantity } },
    { new: true }
  )

  if (!product) {
    throw new AppError(ERROR_MESSAGES.LOW_STOCK, HTTP_STATUS.BAD_REQUEST)
  }

  return product
}
