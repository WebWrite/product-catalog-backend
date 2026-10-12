import { HTTP_STATUS } from "../constants/statusCodes.js"
import CartManager from "../managers/cartManager.js"

class CartController {
  static async AddCart(req, res) {
    console.log(req.user.id)
    console.log(req.body)
    let cart = await CartManager.AddCartItem({
      userId: req.user.id,
      ...req.body
    })
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      cart
    })
  }
}

export default CartController
