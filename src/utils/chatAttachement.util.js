import { randomUUID } from "node:crypto"
import streamifier from "streamifier"
import { ERROR_MESSAGES } from "../constants/errorMessages.js"
import { HTTP_STATUS } from "../constants/statusCodes.js"
import AppError from "./AppError.js"
import cloudinary from "../config/cloudinary.js"

export const uploadChatAttachments = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "product-catalog/chat",
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

export const deleteChatAttachment = async (publicId) => {
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
