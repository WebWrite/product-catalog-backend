
import { randomUUID } from "node:crypto";
import streamifier from "streamifier";
import cloudinary from "../config/cloudinary.js";
import { PRODUCT_IMAGE_FOLDER } from "../constants/productConstants.js";

export const uploadProductImage = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: PRODUCT_IMAGE_FOLDER,
        public_id: randomUUID(),
        resource_type: "image",
        allowed_formats: ["webp"],
      },
      (error, result) => {
        if (error) return reject(error);

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });

export const deleteProductImage = async (publicId) => {
  if (!publicId) return;

  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true,
  });

  if (result.result !== "ok" && result.result !== "not found") {
    throw new Error(`Cloudinary image deletion failed: ${result.result}`);
  }

  return result;
};
