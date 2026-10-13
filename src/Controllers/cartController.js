import { HTTP_STATUS } from "../constants/statusCodes.js"
import { SUCCESS_MESSAGES } from "../constants/successMessages.js"
import CartManager from "../managers/cartManager.js"

class CartController {
  static async addCart(req, res) {
    let cart = await CartManager.AddCartItem({
      userId: req.user.id,
      ...req.body
    })
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      cart
    })
  }

  static async getCart(req, res) {
    let cart = await CartManager.FetchCart(req.user.id)
    if (!cart) {
      return res
        .status(HTTP_STATUS.OK)
        .json({ message: SUCCESS_MESSAGES.EMPTY_CART })
    }
    return res.status(HTTP_STATUS.OK).json({ success: true, cart })
  }

  static async editCart(req, res) {
    const { itemId } = req.params
    console.log(itemId)
    const { quantity } = req.body
    const userId = req.user.id
    let cart = await CartManager.editCart({ itemId, quantity, userId })
    return res.status(HTTP_STATUS.OK).json({ success: true, cart })
  }

  static async deleteCartItem(req, res) {
    const userId = req.user.id
    const { itemId } = req.params
    let cart = await CartManager.removeItem(userId, itemId)
    return res.status(HTTP_STATUS.OK).json({ success: true, cart })
  }

  static async deleteCart(req, res) {
    const userId = req.user.id
    await CartManager.deleteCart(userId)
    return res
      .status(HTTP_STATUS.OK)
      .json({ success: true, message: SUCCESS_MESSAGES.CART_DELETED })
  }

  static async mergeCarts(req, res) {
    const userId = req.user.id
    console.log(req.body.items)
    const cart = CartManager.merge(userId, req.body.items)
    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      cart
    })
  }
}

export default CartController
