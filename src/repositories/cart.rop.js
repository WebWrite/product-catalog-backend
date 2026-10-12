import { ERROR_MESSAGES } from "../constants/errorMessages.js"
import { HTTP_STATUS } from "../constants/statusCodes.js"
import Cart from "../models/Cart.js"
import AppError from "../utils/AppError.js"

class CartRepository {
  static async AddItem(data) {
    const { userId, productId, quantity, size } = data

    let cart = await Cart.findOne({ userId })

    if (!cart) {
      cart = await Cart.create({
        userId,
        items: [{ productId, quantity, size }]
      })

      return cart
    }

    const existingItem = cart.items.find(
      (item) =>
        item.productId.toString() === productId.toString() && item.size === size
    )

    if (existingItem) {
      if (existingItem.quantity + quantity > 25) {
        throw new AppError(
          ERROR_MESSAGES.CART_QUANTITY_EXCEED,
          HTTP_STATUS.BAD_REQUEST
        )
      }

      existingItem.quantity += quantity
    } else {
      cart.items.push({ productId, quantity, size })
    }

    await cart.save()

    return cart
  }
}

export default CartRepository
