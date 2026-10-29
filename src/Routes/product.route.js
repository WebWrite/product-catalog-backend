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

const router = Router()

/**
 * @swagger
 * /api/v1/seller/add-product:
 *   post:
 *     tags: [Products]
 *     summary: Create a product as a seller
 *     security: [{ accessToken: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *             schema:
 *               type: object
 *               required: [image, category, name, description, price, stock]
 *               properties:
 *                 image: { type: string, format: binary }
 *                 category: { type: string }
 *                 name: { type: string, minLength: 2, maxLength: 200 }
 *                 description: { type: string, minLength: 10, maxLength: 5000 }
 *                 price: { type: integer, minimum: 1, maximum: 1000000 }
 *                 sizes:
 *                   type: array
 *                   uniqueItems: true
 *                   items: { type: string, enum: [S, M, L, XL] }
 *                 stock: { type: integer, minimum: 1, maximum: 100000 }
 *                 status: { type: string, enum: [active, inactive] }
 *     responses:
 *       201: { description: Product created }
 */
router.post(
  "/seller/add-product",
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  allowedRoles("seller"),
  upload.single("image"),
  validateImageSignature(true),
  validate(createProductSchema),
  asyncHandler(addProduct)
)

/**
 * @swagger
 * /api/v1/seller/products:
 *   get:
 *     tags: [Products]
 *     summary: List the seller's products
 *     security: [{ accessToken: [] }]
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, minimum: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, minimum: 1, maximum: 50 } }
 *       - { in: query, name: category, schema: { type: string } }
 *       - { in: query, name: search, schema: { type: string } }
 *       - { in: query, name: sortBy, schema: { type: string, enum: [newest, oldest, price-asc, price-desc] } }
 *     responses:
 *       200: { description: Seller products }
 */
router.get(
  "/seller/products",
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  allowedRoles("seller"),
  asyncHandler(getSellerProducts)
)

/**
 * @swagger
 * /api/v1/seller/products/stats:
 *   get:
 *     tags: [Products]
 *     summary: Get seller product statistics
 *     security: [{ accessToken: [] }]
 *     responses:
 *       200: { description: Product statistics }
 */
router.get(
  "/seller/products/stats",
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  allowedRoles("seller"),
  asyncHandler(getSellerProductStats)
)

/**
 * @swagger
 * /api/v1/seller/update-stock/{id}:
 *   patch:
 *     tags: [Products]
 *     summary: Update product stock
 *     security: [{ accessToken: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *             schema:
 *               type: object
 *               required: [stock]
 *               properties:
 *                 stock: { type: integer, minimum: 0 }
 *     responses:
 *       200: { description: Stock updated }
 */
router.patch(
  "/seller/update-stock/:id",
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  allowedRoles("seller"),
  validate(updateProductStockSchema),
  asyncHandler(updateProductStock)
)

/**
 * @swagger
 * /api/v1/seller/delete-product/{id}:
 *   delete:
 *     tags: [Products]
 *     summary: Delete a seller product
 *     security: [{ accessToken: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Product deleted }
 */
router.delete(
  "/seller/delete-product/:id",
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  allowedRoles("seller"),
  asyncHandler(deleteProduct)
)

/**
 * @swagger
 * /api/v1/seller/bulk-delete:
 *   delete:
 *     tags: [Products]
 *     summary: Delete multiple seller products
 *     security: [{ accessToken: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *             schema:
 *               type: object
 *               required: [productIds]
 *               properties:
 *                 productIds:
 *                   type: array
 *                   minItems: 1
 *                   maxItems: 100
 *                   uniqueItems: true
 *                   items: { type: string, pattern: '^[a-fA-F0-9]{24}$' }
 *     responses:
 *       200: { description: Products deleted }
 */
router.delete(
  "/seller/bulk-delete",
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  allowedRoles("seller"),
  validate(bulkDeleteProductsSchema),
  asyncHandler(bulkDeleteProducts)
)

/**
 * @swagger
 * /api/v1/seller/update-product/{id}:
 *   patch:
 *     tags: [Products]
 *     summary: Update a seller product
 *     security: [{ accessToken: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image: { type: string, format: binary }
 *               category: { type: string }
 *               name: { type: string, minLength: 2, maxLength: 200 }
 *               description: { type: string, minLength: 10, maxLength: 5000 }
 *               price: { type: integer, minimum: 1, maximum: 1000000 }
 *               sizes:
 *                 type: array
 *                 uniqueItems: true
 *                 items: { type: string, enum: [S, M, L, XL] }
 *               stock: { type: integer, minimum: 1, maximum: 100000 }
 *               status: { type: string, enum: [active, inactive] }
 *     responses:
 *       200: { description: Product updated }
 */
router.patch(
  "/seller/update-product/:id",
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  allowedRoles("seller"),
  validateObjectId,
  upload.single("image"),
  validateImageSignature(false),
  validate(updateProductSchema),
  asyncHandler(updateProduct)
)

//public
/**
 * @swagger
 * /api/v1:
 *   get:
 *     tags: [Products]
 *     summary: List products
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, minimum: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, minimum: 1, maximum: 15 } }
 *       - { in: query, name: search, schema: { type: string } }
 *       - { in: query, name: category, schema: { type: string } }
 *       - { in: query, name: minPrice, schema: { type: number, minimum: 0 } }
 *       - { in: query, name: maxPrice, schema: { type: number, minimum: 0 } }
 *       - { in: query, name: sortBy, schema: { type: string } }
 *       - { in: query, name: inStock, schema: { type: boolean } }
 *     responses:
 *       200: { description: Product list }
 *
 * /api/v1/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get a product by ID
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Product details }
 */
router.get("/", asyncHandler(getAllProducts))
router.get("/:id", validateObjectId, asyncHandler(getProductById))

export default router
