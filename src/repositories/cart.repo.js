import mongoose from "mongoose"
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
        item.productId.toString() === productId.toString() &&
        (size == null ? item.size == null : item.size === size)
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
    return await Cart.findOne({ userId }).populate({
      path: "items.productId",

      populate: {
        path: "sellerId",
        select: "name email isVerified"
      }
    })
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
    let cart = await Cart.findOne({ userId })

    if (!cart) {
      cart = await Cart.create({
        userId,
        items: []
      })
    }

    for (const item of items) {
      const existing = cart.items.find(
        (i) =>
          i.productId.toString() === item.productId.toString() &&
          i.size === item.size
      )

      if (existing) {
        existing.quantity = Math.min(25, existing.quantity + item.quantity)
      } else {
        cart.items.push({
          ...item,
          quantity: Math.min(25, item.quantity)
        })
      }
    }

    await cart.save()
    return await this.getCart(userId)
  }

  static async findUserCartCount(userId) {
    let result = await Cart.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId)
        }
      },
      {
        $project: {
          _id: 0,
          count: {
            $sum: "$items.quantity"
          }
        }
      }
    ])

    const cartCount = result[0]?.count ?? 0
    return cartCount
  }


  static async getCartForOrder(userId, session) {
  return Cart.findOne({ userId })
    .session(session)
    .lean()
}

static async clearCartForOrder(userId, session) {
  return Cart.updateOne(
    { userId },
    { $set: { items: [] } },
    { session }
  )
}




}

export default CartRepository
