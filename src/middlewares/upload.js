import multer from "multer";
import {ALLOWED_IMAGE_MIME_TYPES,PRODUCT_LIMITS,} from "../constants/productConstants.js";

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: PRODUCT_LIMITS.maxImageSize,
    files: 1,
  },

  fileFilter: (req, file, cb) => {
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
      return cb(
        new Error("Only JPEG, PNG, and WebP images are allowed.")
      );
    }

    cb(null, true);
  },
});

export default upload;