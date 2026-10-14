import { ERROR_MESSAGES } from "../constants/errorMessages.js"
import { HTTP_STATUS } from "../constants/statusCodes.js"
import Product from "../models/Product.js"
import CartRepository from "../repositories/cart.rop.js"
import AppError from "../utils/AppError.js"

class CartManager {
  static async AddCartItem(data) {
    const { productId } = data
    const product = await Product.findById(productId)

    if (!product || product.status !== "active") {
      throw new AppError(
        ERROR_MESSAGES.PRODUCT_NOT_FOUND,
        HTTP_STATUS.NOT_FOUND
      )
    }

    return await CartRepository.AddItem(data)
  }

  static async FetchCart(userId) {
    return await CartRepository.getCart(userId)
  }

  static async editCart(data) {
    const { userId, itemId, quantity } = data

    const cart = await CartRepository.getCart(userId)

    if (!cart || cart.items.length === 0) {
      throw new AppError(ERROR_MESSAGES.EMPTY_CART, HTTP_STATUS.NOT_FOUND)
    }

    const item = cart.items.id(itemId)

    if (!item) {
      throw new AppError(
        ERROR_MESSAGES.CART_ITEM_NOT_FOUND,
        HTTP_STATUS.NOT_FOUND
      )
    }

    const newQuantity = item.quantity + quantity

    if (newQuantity < 0) {
      throw new AppError(
        ERROR_MESSAGES.INVALID_QUANTITY,
        HTTP_STATUS.BAD_REQUEST
      )
    }

    if (newQuantity > 25) {
      throw new AppError(
        ERROR_MESSAGES.CART_QUANTITY_EXCEED,
        HTTP_STATUS.BAD_REQUEST
      )
    }

    return await CartRepository.editCart(cart, data)
  }

  static async removeItem(userId, id) {
    const cart = await CartRepository.getCart(userId)

    if (!cart || cart.items.length === 0) {
      throw new AppError(ERROR_MESSAGES.EMPTY_CART, HTTP_STATUS.NOT_FOUND)
    }

    const item = cart.items.id(id)

    if (!item) {
      throw new AppError(
        ERROR_MESSAGES.CART_ITEM_NOT_FOUND,
        HTTP_STATUS.NOT_FOUND
      )
    }

    return await CartRepository.removeItem(cart, id)
  }

  static async deleteCart(userId) {
    const cart = await CartRepository.getCart(userId)

    if (!cart || cart.items.length === 0) {
      throw new AppError(ERROR_MESSAGES.EMPTY_CART, HTTP_STATUS.NOT_FOUND)
    }

    return await CartRepository.delete(userId)
  }

  static async merge(userId, data) {
    const cart = await CartRepository.getCart(userId)
    const skipped = []
    const itemsToMerge = []

    for (const item of data) {
      const existing = cart?.items.find(
        (i) =>
          i.productId.toString() === item.productId.toString() &&
          i.size === item.size
      )

      const room = 25 - (existing?.quantity ?? 0)
      const quantity = Math.min(item.quantity, room)

      if (quantity <= 0) {
        skipped.push({
          productId: item.productId,
          reason: "CART_LIMIT"
        })
        continue
      }

      itemsToMerge.push({
        productId: item.productId,
        size: item.size,
        quantity
      })
    }

    if (itemsToMerge.length === 0) {
      return { cart, skipped }
    }

    const updatedCart = await CartRepository.mergeItems(userId, itemsToMerge)

    return { cart: updatedCart, skipped }
  }
}

export default CartManager
