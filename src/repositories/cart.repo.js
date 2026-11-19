import mongoose from "mongoose"
import { ERROR_MESSAGES } from "../constants/errorMessages.js"
import { HTTP_STATUS } from "../constants/statusCodes.js"
import Cart from "../models/Cart.js"
import AppError from "../utils/AppError.js"
import User from "../models/User.js"
import Product from "../models/Product.js"

class CartRepository {
  static async AddItem(data, cart) {
    const { userId, productId, quantity, size } = data

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

    if (existingItem) {
      return Cart.findOneAndUpdate(
        {
          userId,
          "items._id": existingItem._id
        },
        {
          $set: {
            "items.$.quantity": newQuantity
          }
        },
        { returnDocument: "after", runValidators: true }
      )
    }

    return Cart.findOneAndUpdate(
      { userId },
      {
        $push: {
          items: { productId, quantity, size }
        },
        $setOnInsert: { userId }
      },
      {
        returnDocument: "after",
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    )
  }

  static async getCart(userId) {
    const [cart] = await Cart.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId)
        }
      },
      {
        $lookup: {
          from: Product.collection.name,
          localField: "items.productId",
          foreignField: "_id",
          as: "products"
        }
      }
    ])

    if (!cart) return null

    const sellerIds = cart.products.map((product) => product.sellerId)

    const sellers = await User.find(
      { _id: { $in: sellerIds } },
      "name email isVerified"
    ).lean()

    const sellerMap = new Map(
      sellers.map((seller) => [seller._id.toString(), seller])
    )

    const productMap = new Map(
      cart.products.map((product) => [
        product._id.toString(),
        {
          ...product,
          sellerId: sellerMap.get(product.sellerId.toString()) ?? null
        }
      ])
    )

    cart.items = cart.items.map((item) => ({
      ...item,
      productId: productMap.get(item.productId.toString()) ?? null
    }))

    delete cart.products

    return cart
  }

  static getCartForUpdate(userId) {
    return Cart.findOne({ userId })
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
          (i.size ?? null) === (item.size ?? null)
      )

      if (existing) {
        existing.quantity = Math.min(25, existing.quantity + item.quantity)
      } else {
        cart.items.push({
          ...item,
          size: item.size ?? null,
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
    return Cart.findOne({ userId }).session(session).lean()
  }

  static async clearCartForOrder(userId, session) {
    return Cart.updateOne({ userId }, { $set: { items: [] } }, { session })
  }
}

export default CartRepository
