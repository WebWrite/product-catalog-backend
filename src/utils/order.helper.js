import crypto from "node:crypto"
import AppError from "./AppError.js"
import { HTTP_STATUS } from "../constants/statusCodes.js"

export const SHIPPING_COST = 10

export const getProductSize = (product, requestedSize) => {
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

export const generateRequestHash = (data) => {
  const checkoutData = {
    shippingAddress: {
      fullName: data.shippingAddress.fullName,
      phone: data.shippingAddress.phone,
      address: data.shippingAddress.address,
      city: data.shippingAddress.city,
      postalCode: data.shippingAddress.postalCode
    }
  }

  return crypto
    .createHash("sha256")
    .update(JSON.stringify(checkoutData))
    .digest("hex")
}
