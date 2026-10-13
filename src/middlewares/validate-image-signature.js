import { fileTypeFromBuffer } from "file-type";
import { ALLOWED_IMAGE_MIME_TYPES } from "../constants/productConstants.js";

export const validateImageSignature = (required) => async (req, res, next) => {
  try {
    if (!req.file) {
      if (required) {
        return res.status(400).json({
          message: "Product image is required.",
        });
      }

      return next();
    }

    const detectedType = await fileTypeFromBuffer(req.file.buffer);

    if (
      !detectedType ||
      !ALLOWED_IMAGE_MIME_TYPES.includes(detectedType.mime) ||
      detectedType.mime !== req.file.mimetype
    ) {
      return res.status(400).json({
        message: "Invalid image content. Upload a valid JPEG, PNG, or WebP image.",
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};