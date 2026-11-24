import { Router } from "express"
import upload from "../middlewares/upload.js"
import { validateImageSignature } from "../middlewares/validate-image-signature.js"
import {
  bulkDeleteProductsSchema,
  createProductSchema,
  updateProductSchema,
  updateProductStockSchema
} from "../validations/productValidation.js"
import {
  addProduct,
  bulkDeleteProducts,
  deleteProduct,
  getAllProducts,
  getProductById,
  getSellerProducts,
  getSellerProductStats,
  updateProduct,
  updateProductStock
} from "../Controllers/productController.js"
import authentication from "../middlewares/authentication.middleware.js"
import allowedRoles from "../middlewares/allowedRoles.js"
import validate from "../middlewares/validate.js"
import { asyncHandler } from "../utils/wrapasync.js"
import validateObjectId from "../middlewares/validateObjectId.js"
import { sanitizeRichText } from "../middlewares/sanitizeRichText.middleware.js"
import { sanitizeFields } from "../middlewares/sanitizeFields.middleware.js"
import authLimiter from "../middlewares/rateLimiting.js"

const router = Router()

router.post(
  "/seller/add-product",
  authLimiter(1, 20),
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  allowedRoles("seller"),
  upload.single("image"),
  validateImageSignature(true),
  sanitizeFields(["category", "name"]),
  validate(createProductSchema),
  sanitizeRichText("description"),
  asyncHandler(addProduct)
)

router.get(
  "/seller/products",
  authLimiter(1, 30),
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  allowedRoles("seller"),
  asyncHandler(getSellerProducts)
)

router.get(
  "/seller/products/stats",
  authLimiter(1, 30),
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  allowedRoles("seller"),
  asyncHandler(getSellerProductStats)
)

router.patch(
  "/seller/update-stock/:id",
  authLimiter(1, 20),
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  allowedRoles("seller"),
  validate(updateProductStockSchema),
  asyncHandler(updateProductStock)
)

router.delete(
  "/seller/delete-product/:id",
  authLimiter(1, 20),
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  allowedRoles("seller"),
  asyncHandler(deleteProduct)
)

router.delete(
  "/seller/bulk-delete",
  authLimiter(1, 10),
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  allowedRoles("seller"),
  validate(bulkDeleteProductsSchema),
  asyncHandler(bulkDeleteProducts)
)

router.patch(
  "/seller/update-product/:id",
  authLimiter(1, 15),
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  allowedRoles("seller"),
  validateObjectId,
  upload.single("image"),
  validateImageSignature(false),
  sanitizeFields(["category", "name"]),
  validate(updateProductSchema),
  sanitizeRichText("description"),
  asyncHandler(updateProduct)
)

router.get("/", authLimiter(1, 30), asyncHandler(getAllProducts))
router.get(
  "/:id",
  authLimiter(1, 50),
  validateObjectId,
  asyncHandler(getProductById)
)

export default router
