import mongoose from "mongoose"
import AppError from "../utils/AppError.js"
import { HTTP_STATUS } from "../constants/statusCodes.js"
import OrderRepository from "../repositories/order.repo.js"
import CartRepository from "../repositories/cart.repo.js"
import stripe from "../config/stripe.js"
import PaymentRepository from "../repositories/payment.repo.js"
import ActivityLog from "../models/AcitivtyLog.js"

const SHIPPING_COST = 10

const getProductSize = (product, requestedSize) => {
  const sizes = product.sizes ?? []

  if (sizes.length === 0) {
    if (requestedSize) {
      throw new AppError(
        `${product.name} does not support sizes.`,
        HTTP_STATUS.BAD_REQUEST
      )
    }

    return null
  }

  const matchedSize = sizes.find(
    (size) => size.toLowerCase() === requestedSize?.toLowerCase()
  )

  if (!matchedSize) {
    throw new AppError(
      `A valid size is required for ${product.name}.`,
      HTTP_STATUS.BAD_REQUEST
    )
  }

  return matchedSize
}

class OrderManager {
  static async createCodOrder(customerId, data, requestId) {
    if (!mongoose.isObjectIdOrHexString(customerId)) {
      throw new AppError("Invalid customer ID.", HTTP_STATUS.BAD_REQUEST)
    }

    const session = await mongoose.startSession()

    try {
      let createdOrder

      await session.withTransaction(async () => {
        const cart = await CartRepository.getCartForOrder(customerId, session)

        if (!cart?.items?.length) {
          throw new AppError("Your cart is empty.", HTTP_STATUS.BAD_REQUEST)
        }

        const cartItems = cart.items
        const productIds = cartItems.map((item) => item.productId)

        const products = await OrderRepository.findProductsForOrder(
          productIds,
          session
        )

        const items = cartItems.map((cartItem) => {
          const product = products.find(
            (product) =>
              product._id.toString() === cartItem.productId.toString()
          )

          if (!product) {
            throw new AppError(
              "One or more cart products no longer exist.",
              HTTP_STATUS.NOT_FOUND
            )
          }

          if (product.status !== "active") {
            throw new AppError(
              `${product.name} is not available.`,
              HTTP_STATUS.BAD_REQUEST
            )
          }

          return {
            productId: product._id,
            sellerId: product.sellerId,
            name: product.name,
            price: product.price,
            quantity: cartItem.quantity,
            itemTotal: product.price * cartItem.quantity,
            size: getProductSize(product, cartItem.size),
            status: "pending"
          }
        })

        const historyEntries = []

        for (const item of items) {
          const product = await OrderRepository.decreaseStockForOrder(
            item.productId,
            item.quantity,
            session
          )

          if (!product) {
            throw new AppError(
              `Insufficient stock or unavailable product: ${item.name}.`,
              HTTP_STATUS.CONFLICT
            )
          }

          historyEntries.push({
            productId: product._id,
            sellerId: product.sellerId,
            previousStock: product.stock + item.quantity,
            newStock: product.stock,
            reason: "order"
          })
        }

        const subtotal = items.reduce((sum, item) => sum + item.itemTotal, 0)

        const [order] = await OrderRepository.createOrder(
          {
            customerId,
            items,
            shippingAddress: {
              ...data.shippingAddress,
              phone: `+92${data.shippingAddress.phone}`
            },
            subtotal,
            shippingCost: SHIPPING_COST,
            total: subtotal + SHIPPING_COST,
            paymentMethod: "COD",
            paymentStatus: "pending"
          },
          session
        )

        await OrderRepository.createOrderStockHistory(historyEntries, session)

        const result = await CartRepository.clearCartForOrder(
          customerId,
          session
        )

        if (result.matchedCount !== 1) {
          throw new AppError("Unable to clear the cart.", HTTP_STATUS.CONFLICT)
        }

        createdOrder = order

        await ActivityLog.create({
          userId: customerId,
          action: "ORDER_CREATED",
          target: "Order",
          role: "customer",
          status: "success",
          message: "Customer created a COD order",
          requestId,
          metadata: {
            orderId: order._id,
            paymentMethod: "COD",
            total: order.total
          }
        })
      })

      return createdOrder
    } finally {
      await session.endSession()
    }
  }

  static async getMyOrders(customerId) {
    return OrderRepository.findOrdersByCustomerId(customerId)
  }

  static async cancelMyOrderItem(customerId, orderId, itemId, requestId) {
    const session = await mongoose.startSession()

    try {
      let updatedOrder

      await session.withTransaction(async () => {
        const order = await OrderRepository.findCustomerOrder(
          orderId,
          customerId,
          session
        )

        if (!order) {
          throw new AppError("Order not found.", HTTP_STATUS.NOT_FOUND)
        }

        const item = order.items.find((item) => item._id.toString() === itemId)

        if (!item) {
          throw new AppError("Order item not found.", HTTP_STATUS.NOT_FOUND)
        }

        if (item.status !== "pending") {
          throw new AppError(
            "Only pending items can be cancelled.",
            HTTP_STATUS.BAD_REQUEST
          )
        }

        updatedOrder = await OrderRepository.cancelPendingOrderItem(
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

        await OrderRepository.restoreOrderItemStock(item, session)
      })

      const cancelledItem = updatedOrder.items.find(
        (item) => item._id.toString() === itemId
      )

      await ActivityLog.create({
        userId: customerId,
        action: "ORDER_ITEM_CANCELLED",
        target: "Order",
        role: "customer",
        status: "success",
        message: "Customer cancelled an order item",
        requestId,
        metadata: {
          orderId: updatedOrder._id,
          itemId
        }
      })

      return {
        _id: updatedOrder._id,
        shippingAddress: updatedOrder.shippingAddress,
        items: [cancelledItem]
      }
    } finally {
      await session.endSession()
    }
  }

  static async getMySellerOrders(sellerId) {
    return OrderRepository.findOrdersBySellerId(sellerId)
  }

  static async updateMySellerOrderItemStatus(
    sellerId,
    orderId,
    itemId,
    status,
    requestId
  ) {
    const session = await mongoose.startSession()

    try {
      let updatedOrder

      await session.withTransaction(async () => {
        const order = await OrderRepository.findSellerOrderItem(
          orderId,
          itemId,
          sellerId,
          session
        )

        if (!order) {
          throw new AppError(
            "Order item not found for this seller.",
            HTTP_STATUS.NOT_FOUND
          )
        }

        const item = order.items.find((item) => item._id.toString() === itemId)

        if (order.paymentMethod === "STRIPE") {
          if (!(
            (item.status === "pending" && status === "cancelled") ||
            (item.status === "confirmed" && status === "delivered")
          )) {
            throw new AppError(
              "Invalid item status transition.",
              HTTP_STATUS.BAD_REQUEST
            )
          }
        } else if (order.paymentMethod === "COD") {
          if (
            item.status !== "pending" ||
            !["cancelled", "delivered"].includes(status)
          ) {
            throw new AppError(
              "Invalid item status transition.",
              HTTP_STATUS.BAD_REQUEST
            )
          }
        } else {
          throw new AppError(
            "Unsupported payment method.",
            HTTP_STATUS.BAD_REQUEST
          )
        }

        updatedOrder = await OrderRepository.updateSellerOrderItemStatus(
          orderId,
          itemId,
          sellerId,
          item.status,
          status,
          session
        )

        if (!updatedOrder) {
          throw new AppError(
            "Order item status could not be updated.",
            HTTP_STATUS.CONFLICT
          )
        }

        if (status === "cancelled") {
          await OrderRepository.restoreOrderItemStock(item, session)
        }
      })

      const updatedItem = updatedOrder.items.find(
        (item) => item._id.toString() === itemId
      )

      await ActivityLog.create({
        userId: sellerId,
        action: "ORDER_ITEM_STATUS_UPDATED",
        target: "Order",
        role: "seller",
        status: "success",
        message: `Seller updated an order item status to ${status}`,
        requestId,
        metadata: {
          orderId: updatedOrder._id,
          itemId,
          newStatus: status
        }
      })

      return {
        _id: updatedOrder._id,
        items: [updatedItem]
      }
    } finally {
      await session.endSession()
    }
  }

  static async createStripeCheckout(customerId, data, requestId) {
    const cart = await CartRepository.getCartForOrder(customerId)

    if (!cart?.items?.length) {
      throw new AppError("Your cart is empty.", HTTP_STATUS.BAD_REQUEST)
    }

    const products = await OrderRepository.findProductsForOrder(
      cart.items.map((item) => item.productId)
    )

    const items = cart.items.map((cartItem) => {
      const product = products.find(
        (item) => item._id.toString() === cartItem.productId.toString()
      )

      if (!product || product.status !== "active") {
        throw new AppError(
          "One or more products are unavailable.",
          HTTP_STATUS.BAD_REQUEST
        )
      }

      if (product.stock < cartItem.quantity) {
        throw new AppError(
          `Insufficient stock for ${product.name}.`,
          HTTP_STATUS.CONFLICT
        )
      }

      return {
        productId: product._id,
        sellerId: product.sellerId,
        name: product.name,
        price: product.price,
        quantity: cartItem.quantity,
        itemTotal: product.price * cartItem.quantity,
        size: getProductSize(product, cartItem.size),
        status: "pending"
      }
    })

    const subtotal = items.reduce((sum, item) => sum + item.itemTotal, 0)

    const total = subtotal + SHIPPING_COST

    const paymentExpiresAt = new Date(Date.now() + 15 * 60 * 1000)

    const [order] = await OrderRepository.createOrder({
      customerId,
      items,
      shippingAddress: {
        ...data.shippingAddress,
        phone: `+92${data.shippingAddress.phone}`
      },
      subtotal,
      shippingCost: SHIPPING_COST,
      total,
      paymentMethod: "STRIPE",
      paymentStatus: "pending",
      paymentExpiresAt
    })

    const lineItems = items.map((item) => ({
      price_data: {
        currency: "pkr",
        product_data: { name: item.name },
        unit_amount: Math.round(item.price * 100)
      },
      quantity: item.quantity
    }))

    lineItems.push({
      price_data: {
        currency: "pkr",
        product_data: { name: "Delivery" },
        unit_amount: Math.round(SHIPPING_COST * 100)
      },
      quantity: 1
    })

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment/cancelled`
    })

    await PaymentRepository.createPayment({
      orderId: order._id,
      provider: "stripe",
      sessionId: checkoutSession.id,
      amount: total,
      currency: "PKR",
      status: "pending"
    })

    await ActivityLog.create({
      userId: customerId,
      action: "STRIPE_CHECKOUT_CREATED",
      target: "Payment",
      role: "customer",
      status: "success",
      message: "Customer created a Stripe checkout session",
      requestId,
      metadata: {
        orderId: order._id,
        sessionId: checkoutSession.id,
        paymentMethod: "STRIPE",
        total
      }
    })

    return {
      orderId: order._id,
      checkoutUrl: checkoutSession.url
    }
  }

  static async handleStripeWebhook(rawBody, signature, requestId) {
    let event

    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      )
    } catch {
      throw new AppError(
        "Invalid Stripe webhook signature.",
        HTTP_STATUS.BAD_REQUEST
      )
    }

    const checkoutSession = event.data.object

    const isSuccess =
      event.type === "checkout.session.completed" &&
      checkoutSession.payment_status === "paid"

    const isFailed = [
      "checkout.session.async_payment_failed",
      "checkout.session.expired"
    ].includes(event.type)

    if (!isSuccess && !isFailed) return

    const dbSession = await mongoose.startSession()

    try {
      await dbSession.withTransaction(async () => {
        const payment = await PaymentRepository.findBySessionId(
          checkoutSession.id,
          dbSession
        )

        if (!payment || payment.status !== "pending") return

        const order = await OrderRepository.findOrderById(
          payment.orderId,
          dbSession
        )

        if (!order || order.paymentStatus !== "pending") return

        if (!order.items.every((item) => item.status === "pending")) return

        if (isFailed) {
          await PaymentRepository.updatePaymentBySessionId(
            checkoutSession.id,
            { status: "failed" },
            dbSession
          )

          await OrderRepository.updateOrderPaymentStatus(
            order._id,
            "failed",
            dbSession
          )
          await ActivityLog.create(
            [
              {
                userId: order.customerId,
                action: "STRIPE_PAYMENT_FAILED",
                target: "Payment",
                role: "customer",
                status: "failure",
                message: "Stripe payment failed or checkout expired",
                requestId,
                metadata: {
                  orderId: order._id,
                  paymentId: payment._id,
                  sessionId: checkoutSession.id,
                  stripeEventId: event.id,
                  eventType: event.type
                }
              }
            ],
            { session: dbSession }
          )

          return
        }

        if (
          checkoutSession.amount_total !== Math.round(order.total * 100) ||
          checkoutSession.amount_total !== Math.round(payment.amount * 100) ||
          checkoutSession.currency?.toLowerCase() !==
            payment.currency.toLowerCase()
        ) {
          throw new AppError(
            "Invalid payment details.",
            HTTP_STATUS.BAD_REQUEST
          )
        }

        const historyEntries = []

        for (const item of order.items) {
          const product = await OrderRepository.decreaseStockForOrder(
            item.productId,
            item.quantity,
            dbSession
          )

          if (!product) {
            throw new AppError(
              `Insufficient stock for ${item.name}.`,
              HTTP_STATUS.CONFLICT
            )
          }

          historyEntries.push({
            productId: product._id,
            sellerId: item.sellerId,
            previousStock: product.stock + item.quantity,
            newStock: product.stock,
            reason: "order"
          })
        }

        await OrderRepository.createOrderStockHistory(historyEntries, dbSession)

        await OrderRepository.updateOrderPaymentStatus(
          order._id,
          "completed",
          dbSession
        )

        await PaymentRepository.updatePaymentBySessionId(
          checkoutSession.id,
          {
            status: "completed"
          },
          dbSession
        )

        await CartRepository.clearCartForOrder(order.customerId, dbSession)
        await ActivityLog.create(
          [
            {
              userId: order.customerId,
              action: "STRIPE_PAYMENT_COMPLETED",
              target: "Payment",
              role: "customer",
              status: "success",
              message: "Stripe payment completed successfully",
              requestId,
              metadata: {
                orderId: order._id,
                paymentId: payment._id,
                sessionId: checkoutSession.id,
                stripeEventId: event.id,
                amount: payment.amount,
                currency: payment.currency
              }
            }
          ],
          { session: dbSession }
        )
      })
    } finally {
      await dbSession.endSession()
    }
  }

  static async retryStripePayment(customerId, orderId, requestId) {
    if (!mongoose.isValidObjectId(orderId)) {
      throw new AppError("Invalid order ID.", HTTP_STATUS.BAD_REQUEST)
    }

    const order = await OrderRepository.findCustomerOrder(orderId, customerId)

    if (!order) {
      throw new AppError("Order not found.", HTTP_STATUS.NOT_FOUND)
    }

    const cart = await CartRepository.getCartForOrder(customerId)

    const cartItems = new Set(
      (cart?.items ?? []).map(
        (item) => `${item.productId}:${item.quantity}:${item.size ?? ""}`
      )
    )

    const isCartMatchingOrder =
      cartItems.size === order.items.length &&
      order.items.every((item) =>
        cartItems.has(`${item.productId}:${item.quantity}:${item.size ?? ""}`)
      )

    if (!isCartMatchingOrder) {
      throw new AppError(
        "Your current cart does not match this order. Make a new order",
        HTTP_STATUS.CONFLICT
      )
    }

    const allItemsPending =
      order.items.length > 0 &&
      order.items.every((item) => item.status === "pending")

    if (!allItemsPending) {
      throw new AppError(
        "Payment cannot be retried because some order items are no longer pending.",
        HTTP_STATUS.CONFLICT
      )
    }
    if (order.paymentMethod !== "STRIPE") {
      throw new AppError(
        "This order does not use Stripe.",
        HTTP_STATUS.BAD_REQUEST
      )
    }

    if (order.paymentStatus === "completed") {
      throw new AppError(
        "This order has already been paid.",
        HTTP_STATUS.CONFLICT
      )
    }

    if (order.paymentStatus !== "pending" && order.paymentStatus !== "failed") {
      throw new AppError(
        "Payment cannot be retried for this order.",
        HTTP_STATUS.CONFLICT
      )
    }

    const lineItems = order.items.map((item) => ({
      price_data: {
        currency: "pkr",
        product_data: {
          name: item.name
        },
        unit_amount: Math.round(item.price * 100)
      },
      quantity: item.quantity
    }))
    lineItems.push({
      price_data: {
        currency: "pkr",
        product_data: {
          name: "Delivery"
        },
        unit_amount: Math.round(order.shippingCost * 100)
      },
      quantity: 1
    })

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment/cancelled`,
      metadata: {
        orderId: order._id.toString()
      }
    })

    const payment = await PaymentRepository.updatePaymentByOrderId(order._id, {
      sessionId: checkoutSession.id
    })

    if (!payment) {
      throw new AppError(
        "Payment record not found for this order.",
        HTTP_STATUS.NOT_FOUND
      )
    }

    await ActivityLog.create({
      userId: customerId,
      action: "STRIPE_PAYMENT_RETRY_CREATED",
      target: "Payment",
      role: "customer",
      status: "success",
      message: "Customer retried Stripe payment",
      requestId,
      metadata: {
        orderId: order._id,
        sessionId: checkoutSession.id
      }
    })

    return {
      orderId: order._id,
      checkoutUrl: checkoutSession.url
    }
  }
}

export default OrderManager
