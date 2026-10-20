import mongoose from "mongoose";
import AppError from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/statusCodes.js";
import { cancelPendingOrderItem, createOrder, createOrderStockHistory, decreaseStockForOrder, findCustomerOrder, findOrdersByCustomerId, findOrdersBySellerId, findProductsForOrder, restoreOrderItemStock } from "../repositories/order.repo.js";
import CartRepository from "../repositories/cart.rop.js";


const SHIPPING_COST = 10; 

const getProductSize = (product, requestedSize) => {
    const sizes = product.sizes ?? [];

    if (sizes.length === 0) {
        if (requestedSize) {
            throw new AppError(
                `${product.name} does not support sizes.`,
                HTTP_STATUS.BAD_REQUEST
            );
        }

        return null;
    }

    const matchedSize = sizes.find(
        (size) => size.toLowerCase() === requestedSize?.toLowerCase()
    );

    if (!matchedSize) {
        throw new AppError(
            `A valid size is required for ${product.name}.`,
            HTTP_STATUS.BAD_REQUEST
        );
    }

    return matchedSize;
};


export const createCodOrder = async (customerId, data) => {
  if (!mongoose.isObjectIdOrHexString(customerId)) {
    throw new AppError(
      "Invalid customer ID.",
      HTTP_STATUS.BAD_REQUEST
    )
  }

  const session = await mongoose.startSession()

  try {
    let createdOrder

    await session.withTransaction(async () => {
      const cart = await CartRepository.getCartForOrder(customerId,session )

      if (!cart?.items?.length) {
        throw new AppError("Your cart is empty.",HTTP_STATUS.BAD_REQUEST )
      }

      const cartItems = cart.items
      const productIds = cartItems.map((item) => item.productId)

      const products = await findProductsForOrder(productIds,session)

      const items = cartItems.map((cartItem) => {
        const product = products.find((product) =>product._id.toString() === cartItem.productId.toString())

        if (!product) {
          throw new AppError("One or more cart products no longer exist.",HTTP_STATUS.NOT_FOUND)
        }

        if (product.status !== "active") {
          throw new AppError(`${product.name} is not available.`,HTTP_STATUS.BAD_REQUEST)
        }

        return {
          productId: product._id,
          sellerId: product.sellerId,
          name: product.name,
          price: product.price,
          quantity: cartItem.quantity,
          itemTotal: product.price * cartItem.quantity,
          size: getProductSize(product, cartItem.size),
          status: "pending",
        }
      })

      //  Decrease stock and  history entries.
      const historyEntries = []

      for (const item of items) {
        const product = await decreaseStockForOrder(
          item.productId,
          item.quantity,
          session
        )

        if (!product) {
          throw new AppError(`Insufficient stock or unavailable product: ${item.name}.`,HTTP_STATUS.CONFLICT)
        }

        historyEntries.push({
          productId: product._id,
          sellerId: product.sellerId,
          previousStock: product.stock + item.quantity,
          newStock: product.stock,
          reason: "order",
        })
      }

      const subtotal = items.reduce((sum, item) => sum + item.itemTotal,0)

      const [order] = await createOrder(
        {
          customerId,
          items,
          shippingAddress: {
            ...data.shippingAddress,
            phone: `+92${data.shippingAddress.phone}`,
          },
          subtotal,
          shippingCost: SHIPPING_COST,
          total: subtotal + SHIPPING_COST,
          paymentMethod: "COD",
          paymentStatus: "pending",
        },
        session
      )

      await createOrderStockHistory(historyEntries, session)

      const result = await CartRepository.clearCartForOrder(customerId,session)

      if (result.matchedCount !== 1) {
        throw new AppError("Unable to clear the cart.",HTTP_STATUS.CONFLICT)
      }
      createdOrder = order
    })

    return createdOrder
  } finally {
    await session.endSession()
  }
}


export const getMyOrders = async (customerId) => {
  return findOrdersByCustomerId(customerId)
}




export const cancelMyOrderItem = async (customerId, orderId, itemId) => {
  const session = await mongoose.startSession()

  try {
    let updatedOrder

    await session.withTransaction(async () => {
      const order = await findCustomerOrder(orderId, customerId, session)

      if (!order) {
        throw new AppError("Order not found.", HTTP_STATUS.NOT_FOUND)
      }

      const item = order.items.id(itemId)

      if (!item) {
        throw new AppError("Order item not found.", HTTP_STATUS.NOT_FOUND)
      }

      if (item.status !== "pending") {
        throw new AppError(
          "Only pending items can be cancelled.",
          HTTP_STATUS.BAD_REQUEST
        )
      }

      updatedOrder = await cancelPendingOrderItem(
        orderId,
        itemId,
        customerId,
        session
      )

      if (!updatedOrder) {
        throw new AppError(
          "This item can no longer be cancelled.",
          HTTP_STATUS.CONFLICT
        )
      }

      await restoreOrderItemStock(item, session)
    })
    return updatedOrder
  } finally {
    await session.endSession()
  }
}

export const getMySellerOrders = async (sellerId) => {
  return findOrdersBySellerId(sellerId);
};