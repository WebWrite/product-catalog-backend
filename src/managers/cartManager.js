import { ERROR_MESSAGES } from "../constants/errorMessages.js"
import { HTTP_STATUS } from "../constants/statusCodes.js"
import { adjustStock } from "../helpers/adjustStock.js"
import Product from "../models/Product.js"
import CartRepository from "../repositories/cart.rop.js"
import AppError from "../utils/AppError.js"

class CartManager {
  static async AddCartItem(data) {
    const { productId, quantity } = data

    const product = await Product.findById(productId) //change when we develop the product repo

    if (!product || product.status !== "active") {
      throw new AppError(
        ERROR_MESSAGES.PRODUCT_NOT_FOUND,
        HTTP_STATUS.NOT_FOUND
      )
    }

    await adjustStock(productId, quantity)

    try {
      return await CartRepository.AddItem(data)
    } catch (err) {
      await adjustStock(productId, -quantity)
      throw err
    }
  }

  static async FetchCart(userId) {
    return await CartRepository.getCart(userId)
  }

  static async editCart(data) {
    const { userId, itemId, quantity } = data

    if (!Number.isInteger(quantity) || quantity === 0) {
      throw new AppError(
        ERROR_MESSAGES.INVALID_QUANTITY,
        HTTP_STATUS.BAD_REQUEST
      )
    }

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

    await adjustStock(item.productId, quantity)

    try {
      return await CartRepository.editCart(cart, data)
    } catch (err) {
      await adjustStock(item.productId, -quantity)
      throw err
    }
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
    console.log(item)

    const { productId, quantity } = item

    let updatedCart = await CartRepository.removeItem(cart, id)
    await adjustStock(productId, -quantity)
    return updatedCart
  }

  static async deleteCart(userId) {
    const cart = await CartRepository.delete(userId)

    if (!cart || cart.items.length === 0) {
      throw new AppError(ERROR_MESSAGES.EMPTY_CART, HTTP_STATUS.NOT_FOUND)
    }

    await Promise.all(
      cart.items.map((item) => adjustStock(item.productId, -item.quantity))
    )
    return cart
  }

  static async merge(userId, data) {
    const cart = await CartRepository.getCart(userId)
    const reserved = []
    const skipped = []
    for (const item of data) {
      const existing = cart?.items.find(
        (i) =>
          i.productId.toString() === item.productId.toString() &&
          i.size === item.size
      )
      const room = 25 - (existing?.quantity ?? 0)
      const quantity = Math.min(item.quantity, room)
      if (quantity <= 0) {
        skipped.push({ productId: item.productId, reason: "CART_LIMIT" })
        continue
      }

      try {
        await adjustStock(item.productId, quantity)
        reserved.push({ productId: item.productId, size: item.size, quantity })
      } catch {
        skipped.push({ productId: item.productId, reason: "LOW_STOCK" })
      }
    }

    if (reserved.length === 0) return { cart, skipped }

    try {
      const updatedCart = await CartRepository.mergeItems(userId, reserved)
      return { cart: updatedCart, skipped }
    } catch (err) {
      await Promise.all(
        reserved.map((r) => adjustStock(r.productId, -r.quantity))
      )
      throw err
    }
  }
}

export default CartManager
