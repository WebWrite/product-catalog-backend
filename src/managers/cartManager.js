import CartRepository from "../repositories/cart.rop.js"

class CartManager {
  static async AddCartItem(data) {
    const res = await CartRepository.AddItem(data)
    return res
  }
}
export default CartManager
