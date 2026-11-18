import { ERROR_MESSAGES } from "../constants/errorMessages.js"
import { HTTP_STATUS } from "../constants/statusCodes.js"
import Product from "../models/Product.js"
import CartRepository from "../repositories/cart.repo.js"
import AppError from "../utils/AppError.js"

class CartManager {
  static async AddCartItem(data) {
    const { productId, quantity, userId } = data
    const product = await Product.findById(productId)

    if (!product || product.status !== "active") {
      throw new AppError(
        ERROR_MESSAGES.PRODUCT_NOT_FOUND,
        HTTP_STATUS.NOT_FOUND
      )
    }

    const cart = await CartRepository.getCartForUpdate(userId)
    const currentProductQuantity = (cart?.items ?? [])
      .filter((item) => item.productId.toString() === productId.toString())
      .reduce((total, item) => total + item.quantity, 0)
    const requestedQuantity = currentProductQuantity + quantity

    if (product.stock <= 0 || requestedQuantity > product.stock) {
      throw new AppError(ERROR_MESSAGES.LOW_STOCK, HTTP_STATUS.BAD_REQUEST)
    }

    return await CartRepository.AddItem(data)
  }

  static async FetchCart(userId) {
    return await CartRepository.getCart(userId)
  }

  static async editCart(data) {
    const { userId, itemId, quantity } = data

    const cart = await CartRepository.getCartForUpdate(userId)

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

    if (quantity > 0) {
      const product = await Product.findById(item.productId)
      const currentProductQuantity = cart.items
        .filter(
          (cartItem) =>
            cartItem.productId.toString() === item.productId.toString()
        )
        .reduce((total, cartItem) => total + cartItem.quantity, 0)
      const requestedProductQuantity = currentProductQuantity + quantity

      if (
        !product ||
        product.stock <= 0 ||
        requestedProductQuantity > product.stock
      ) {
        throw new AppError(ERROR_MESSAGES.LOW_STOCK, HTTP_STATUS.BAD_REQUEST)
      }
    }

    await CartRepository.editCart(cart, data)
    return await CartRepository.getCart(userId)
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
    const cart = await CartRepository.getCartForUpdate(userId)
    const skipped = []
    const itemsToMerge = []
    const guestItems = data ?? []
    const productIds = [
      ...new Set(guestItems.map((item) => item.productId.toString()))
    ]
    const products = await Product.find({ _id: { $in: productIds } })
      .select("_id stock status")
      .lean()
    const productsById = new Map(
      products.map((product) => [product._id.toString(), product])
    )
    const currentProductQuantities = new Map()
    const currentVariantQuantities = new Map()

    for (const cartItem of cart?.items ?? []) {
      const id = cartItem.productId.toString()
      const variantKey = `${id}:${cartItem.size ?? ""}`
      currentProductQuantities.set(
        id,
        (currentProductQuantities.get(id) ?? 0) + cartItem.quantity
      )
      currentVariantQuantities.set(
        variantKey,
        (currentVariantQuantities.get(variantKey) ?? 0) + cartItem.quantity
      )
    }

    const addedProductQuantities = new Map()
    const addedVariantQuantities = new Map()

    for (const item of guestItems) {
      const id = item.productId.toString()
      const product = productsById.get(id)
      const variantKey = `${id}:${item.size ?? ""}`

      if (!product || product.status !== "active") {
        skipped.push({
          productId: item.productId,
          reason: "PRODUCT_UNAVAILABLE"
        })
        continue
      }

      const stockRoom =
        product.stock -
        (currentProductQuantities.get(id) ?? 0) -
        (addedProductQuantities.get(id) ?? 0)
      const cartRoom =
        25 -
        (currentVariantQuantities.get(variantKey) ?? 0) -
        (addedVariantQuantities.get(variantKey) ?? 0)
      const quantity = Math.max(0, Math.min(item.quantity, stockRoom, cartRoom))

      if (quantity < item.quantity) {
        skipped.push({
          productId: item.productId,
          reason: stockRoom <= cartRoom ? "LOW_STOCK" : "CART_LIMIT",
          requested: item.quantity,
          accepted: quantity
        })
      }

      if (quantity === 0) continue

      addedProductQuantities.set(
        id,
        (addedProductQuantities.get(id) ?? 0) + quantity
      )
      addedVariantQuantities.set(
        variantKey,
        (addedVariantQuantities.get(variantKey) ?? 0) + quantity
      )
      itemsToMerge.push({
        productId: item.productId,
        size: item.size ?? null,
        quantity
      })
    }

    if (itemsToMerge.length === 0) {
      return { cart: await CartRepository.getCart(userId), skipped }
    }

    const updatedCart = await CartRepository.mergeItems(userId, itemsToMerge)

    return { cart: updatedCart, skipped }
  }
}

export default CartManager
