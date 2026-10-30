import { randomUUID } from "node:crypto"
import streamifier from "streamifier"
import cloudinary from "../config/cloudinary.js"
import { PRODUCT_IMAGE_FOLDER } from "../constants/productConstants.js"
import { ERROR_MESSAGES } from "../constants/errorMessages.js"
import { HTTP_STATUS } from "../constants/statusCodes.js"
import AppError from "./AppError.js"

export const uploadProductImage = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: PRODUCT_IMAGE_FOLDER,
        public_id: randomUUID(),
        resource_type: "image",
        allowed_formats: ["webp"]
      },
      (error, result) => {
        if (error) return reject(error)

        resolve({
          url: result.secure_url,
          publicId: result.public_id
        })
      }
    )

    streamifier.createReadStream(buffer).pipe(stream)
  })

export const deleteProductImage = async (publicId) => {
  if (!publicId) return

  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true
  })

  if (result.result !== "ok" && result.result !== "not found") {
    throw new AppError(
      ERROR_MESSAGES.CLOUDINARY_DELETE_FAILED,
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }

  return result
}

export const deleteProductImages = async (publicIds) => {
  if (!publicIds.length) return

  if (publicIds.length > 100) {
    throw new AppError(
      ERROR_MESSAGES.CLOUDINARY_BULK_DELETE_LIMIT,
      HTTP_STATUS.BAD_REQUEST
    )
  }

  const result = await cloudinary.api.delete_resources(publicIds, {
    resource_type: "image",
    type: "upload",
    invalidate: true
  })

  const failedDeletions = Object.values(result.deleted || {}).filter(
    (status) => status !== "deleted" && status !== "not_found"
  )

  if (failedDeletions.length) {
    throw new AppError(
      ERROR_MESSAGES.CLOUDINARY_BULK_DELETE_FAILED,
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }

  return result
}

export const uploadLogFile = async (filePath, fileName) => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: "application-logs",
    public_id: fileName,
    resource_type: "raw",
    overwrite: true
  })

  if (!result?.secure_url || !result?.public_id) {
    throw new AppError(
      "Cloudinary log upload was unsuccessful",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }

  return result
}
