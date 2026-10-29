import { HTTP_STATUS } from "../constants/statusCodes.js"
import { SUCCESS_MESSAGES } from "../constants/successMessages.js"
import CartManager from "../managers/cartManager.js"
import { logActivity } from "../utils/activityLog.util.js"

class CartController {
  static async addCart(req, res) {
    let cart = await CartManager.AddCartItem({
      userId: req.user.id,
      ...req.body
    })
    await logActivity({
      userId: req.user.id,
      action: "ADD TO CART",
      target: "Cart",
      role: req.user.role,
      message: "Customer add product in cart ",
      requestId: req.requestId,
      metadata: { productId: req.body.productId }
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
    await logActivity({
      userId: req.user.id,
      action: "EDIT CART",
      target: "Cart",
      role: req.user.role,
      message: "Customer edit the cart ",
      requestId: req.requestId,
      metadata: { itemId, quantity }
    })
    return res.status(HTTP_STATUS.OK).json({ success: true, cart })
  }

  static async deleteCartItem(req, res) {
    const userId = req.user.id
    const { itemId } = req.params
    let cart = await CartManager.removeItem(userId, itemId)
    await logActivity({
      userId: req.user.id,
      action: "DELETE CART ITEM",
      target: "Cart",
      role: req.user.role,
      message: "Customer delete item in cart ",
      requestId: req.requestId,
      metadata: { item: itemId }
    })
    return res.status(HTTP_STATUS.OK).json({ success: true, cart })
  }

  static async deleteCart(req, res) {
    const userId = req.user.id
    const cart = await CartManager.deleteCart(userId)
    await logActivity({
      userId: req.user.id,
      action: "DELETE WHOLE CART",
      target: "Cart",
      role: req.user.role,
      message: "Customer delete it's all cart ",
      requestId: req.requestId,
      metadata: { items: cart.items }
    })
    return res
      .status(HTTP_STATUS.OK)
      .json({ success: true, message: SUCCESS_MESSAGES.CART_DELETED })
  }

  static async mergeCarts(req, res) {
    const userId = req.user.id
    console.log(req.body.items)
    const cart = await CartManager.merge(userId, req.body.items)
    await logActivity({
      userId: req.user.id,
      action: "MERGE CART",
      target: "Cart",
      role: req.user.role,
      message: "Customer merge the cart",
      requestId: req.requestId,
      metadata: { items: cart.cart.items }
    })
    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      cart
    })
  }
}

export default CartController
