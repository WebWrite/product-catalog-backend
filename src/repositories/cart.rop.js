import { ERROR_MESSAGES } from "../constants/errorMessages.js"
import { HTTP_STATUS } from "../constants/statusCodes.js"
import Cart from "../models/Cart.js"
import AppError from "../utils/AppError.js"

class CartRepository {
  static async AddItem(data) {
    const { userId, productId, quantity, size } = data

    const cart = await Cart.findOne({ userId })

    const existingItem = cart?.items.find(
      (item) =>
        item.productId.toString() === productId.toString() && item.size === size
    )

    const newQuantity = (existingItem?.quantity ?? 0) + quantity

    if (newQuantity > 25) {
      throw new AppError(
        ERROR_MESSAGES.CART_QUANTITY_EXCEED,
        HTTP_STATUS.BAD_REQUEST
      )
    }

    if (!cart) {
      return await Cart.create({
        userId,
        items: [{ productId, quantity, size }]
      })
    }

    if (existingItem) {
      existingItem.quantity = newQuantity
    } else {
      cart.items.push({ productId, quantity, size })
    }

    await cart.save()

    return cart
  }

  static async getCart(userId) {
    return await Cart.findOne({ userId })
  }

  static async editCart(cart, data) {
    const item = cart.items.id(data.itemId)
    item.quantity += data.quantity

    if (item.quantity === 0) {
      cart.items.pull(data.itemId)
    }

    await cart.save()

    return cart
  }

  static async removeItem(cart, id) {
    cart.items.pull(id)
    await cart.save()
    return cart
  }

  static async delete(id) {
    return await Cart.findOneAndDelete({ userId: id })
  }

  static async mergeItems(userId, items) {
    const cart = await this.getCart(userId)

    for (const item of items) {
      const existing = cart.items.find(
        (i) =>
          i.productId.toString() === item.productId.toString() &&
          i.size === item.size
      )
      if (existing) {
        existing.quantity += item.quantity
      } else {
        cart.items.push(item)
      }
    }
    await cart.save()
    return cart
  }
}

export default CartRepository
