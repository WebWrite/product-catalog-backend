import { Router } from "express"
import { asyncHandler } from "../utils/wrapasync.js"
import AdminController from "../Controllers/adminController.js"
import validateObjectId from "../middlewares/validateObjectId.js"
import upload from "../middlewares/upload.js"
import { validateImageSignature } from "../middlewares/validate-image-signature.js"
import { updateProductSchema } from "../validations/productValidation.js"
import validate from "../middlewares/validate.js"
import { updateSellerSchema } from "../validations/sellerValidation.js"
import { updateSellerOrderItemStatusSchema } from "../validations/orderValidation.js"
import { UpdateUser } from "../validations/authValidation.js"
import authentication from "../middlewares/authentication.middleware.js"
import authorization from "../middlewares/authorization.middleware.js"

const router = Router()
const adminAuthentication = [
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  authorization("admin")
]

/**
 * @swagger
 * /api/v1/admin/activity-logs:
 *   get:
 *     tags: [Admin]
 *     summary: Get paginated application activity logs
 *     security: [{ accessToken: [] }]
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, minimum: 1, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, minimum: 1, maximum: 100, default: 20 } }
 *       - { in: query, name: search, description: Search action, target, message, user name, or email, schema: { type: string } }
 *       - { in: query, name: role, description: Use buyer as an alias for customer, schema: { type: string, enum: [admin, seller, customer, buyer] } }
 *       - { in: query, name: target, schema: { type: string } }
 *       - { in: query, name: dateFrom, schema: { type: string, format: date } }
 *       - { in: query, name: dateTo, schema: { type: string, format: date } }
 *     responses:
 *       200:
 *         description: Activity logs and pagination metadata
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin role required
 *
 * /api/v1/admin/dashboard/summary:
 *   get:
 *     tags: [Admin]
 *     summary: Get dashboard summary
 *     security: [{ accessToken: [] }]
 *     responses:
 *       200: { description: Dashboard summary }
 *
 * /api/v1/admin/dashboard/revenue:
 *   get:
 *     tags: [Admin]
 *     summary: Get revenue analytics
 *     security: [{ accessToken: [] }]
 *     responses:
 *       200: { description: Revenue analytics }
 *
 * /api/v1/admin/dashboard/top-categories:
 *   get:
 *     tags: [Admin]
 *     summary: Get top product categories
 *     security: [{ accessToken: [] }]
 *     responses:
 *       200: { description: Top categories }
 *
 * /api/v1/admin/order-summary:
 *   get:
 *     tags: [Admin]
 *     summary: Get order summary
 *     security: [{ accessToken: [] }]
 *     responses:
 *       200: { description: Order summary }
 *
 * /api/v1/admin/customer-summary:
 *   get:
 *     tags: [Admin]
 *     summary: Get customer summary
 *     security: [{ accessToken: [] }]
 *     responses:
 *       200: { description: Customer summary }
 *
 * /api/v1/admin/seller-summary:
 *   get:
 *     tags: [Admin]
 *     summary: Get seller summary
 *     security: [{ accessToken: [] }]
 *     responses:
 *       200: { description: Seller summary }
 *
 * /api/v1/admin/orders:
 *   get:
 *     tags: [Admin]
 *     summary: List all orders
 *     security: [{ accessToken: [] }]
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, minimum: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, minimum: 1, maximum: 50 } }
 *       - { in: query, name: search, schema: { type: string } }
 *       - { in: query, name: payment, schema: { type: string } }
 *     responses:
 *       200: { description: Orders }
 *
 * /api/v1/admin/order/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Get an order by ID
 *     security: [{ accessToken: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Order details }
 *
 * /api/v1/admin/products:
 *   get:
 *     tags: [Admin]
 *     summary: List all products
 *     security: [{ accessToken: [] }]
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, minimum: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, minimum: 1, maximum: 15 } }
 *       - { in: query, name: search, schema: { type: string } }
 *       - { in: query, name: category, schema: { type: string } }
 *       - { in: query, name: status, schema: { type: string, enum: [active, inactive] } }
 *       - { in: query, name: minPrice, schema: { type: number, minimum: 0 } }
 *       - { in: query, name: maxPrice, schema: { type: number, minimum: 0 } }
 *       - { in: query, name: sortBy, schema: { type: string } }
 *       - { in: query, name: inStock, schema: { type: boolean } }
 *     responses:
 *       200: { description: Products }
 *
 * /api/v1/admin/products/summary:
 *   get:
 *     tags: [Admin]
 *     summary: Get product summary
 *     security: [{ accessToken: [] }]
 *     responses:
 *       200: { description: Product summary }
 *
 * /api/v1/admin/sellers:
 *   get:
 *     tags: [Admin]
 *     summary: List all sellers
 *     security: [{ accessToken: [] }]
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, minimum: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, minimum: 1 } }
 *       - { in: query, name: search, schema: { type: string } }
 *       - { in: query, name: status, schema: { type: string } }
 *       - { in: query, name: category, schema: { type: string } }
 *     responses:
 *       200: { description: Sellers }
 *
 * /api/v1/admin/sellers/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Get seller details
 *     security: [{ accessToken: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Seller details }
 *
 * /api/v1/admin/customers:
 *   get:
 *     tags: [Admin]
 *     summary: List all customers
 *     security: [{ accessToken: [] }]
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, minimum: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, minimum: 1 } }
 *       - { in: query, name: search, schema: { type: string } }
 *       - { in: query, name: status, schema: { type: string, enum: [active, inactive] } }
 *     responses:
 *       200: { description: Customers }
 *
 * /api/v1/admin/customers/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Get customer orders
 *     security: [{ accessToken: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Customer orders }
 */
/**
 * @swagger
 * /api/v1/admin/customers/{id}:
 *   patch:
 *     tags: [Admin]
 *     summary: Update a customer
 *     security: [{ accessToken: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             properties:
 *               name: { type: string, minLength: 3, maxLength: 50 }
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8, maxLength: 128 }
 *               status: { type: string, enum: [active, inactive] }
 *     responses:
 *       200: { description: Customer updated }
 *
 * /api/v1/admin/sellers/{id}:
 *   patch:
 *     tags:
 *       - Admin
 *     summary: Update a seller
 *     description: Update an existing seller's information by ID.
 *     security:
 *       - accessToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: MongoDB ObjectId of the seller
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *           example: "671abc123456789012345678"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               phone:
 *                 type: string
 *                 example: "+923001234567"
 *               status:
 *                 type: string
 *                 enum:
 *                   - active
 *                   - blocked
 *                 example: active
 *             additionalProperties: false
 *     responses:
 *       "200":
 *         description: Seller updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Seller updated successfully
 *                 data:
 *                   type: object
 *                   description: Updated seller information
 *
 * /api/v1/admin/update-product/{id}:
 *   patch:
 *     tags: [Admin]
 *     summary: Update a product as admin
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
 *                 items: { type: string, enum: [S, M, L, XL] }
 *               stock: { type: integer, minimum: 1, maximum: 100000 }
 *               status: { type: string, enum: [active, inactive] }
 *     responses:
 *       200: { description: Product updated }
 *
 * /api/v1/admin/orders/item-status:
 *   patch:
 *     tags: [Admin]
 *     summary: Update an order item status as admin
 *     security: [{ accessToken: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, itemId, status]
 *             properties:
 *               orderId: { type: string, pattern: '^[a-fA-F0-9]{24}$' }
 *               itemId: { type: string, pattern: '^[a-fA-F0-9]{24}$' }
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, processing, shipped, delivered, cancelled]
 *     responses:
 *       200: { description: Order item status updated }
 *
 * /api/v1/admin/delete-product/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete a product as admin
 *     security: [{ accessToken: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Product deleted }
 */
router.get(
  "/activity-logs",
  ...adminAuthentication,
  asyncHandler(AdminController.getActivityLogs)
)

router.get(
  "/dashboard/summary",
  ...adminAuthentication,
  asyncHandler(AdminController.getSummary)
)
router.get(
  "/dashboard/revenue",
  ...adminAuthentication,
  asyncHandler(AdminController.getRevenue)
)
router.get(
  "/dashboard/top-categories",
  ...adminAuthentication,
  asyncHandler(AdminController.getTopCategories)
)
router.get(
  "/order-summary",
  ...adminAuthentication,
  asyncHandler(AdminController.getOrderSummary)
)
router.get(
  "/customer-summary",
  ...adminAuthentication,
  asyncHandler(AdminController.getCustomerSummary)
)
router.get(
  "/seller-summary",
  ...adminAuthentication,
  asyncHandler(AdminController.getSellerSummary)
)
router.get(
  "/order/:id",
  ...adminAuthentication,
  validateObjectId,
  asyncHandler(AdminController.findOrderById)
)
router.get(
  "/orders",
  ...adminAuthentication,
  asyncHandler(AdminController.findOrders)
)
router.get(
  "/products/summary",
  ...adminAuthentication,
  asyncHandler(AdminController.productSummary)
)
router.get(
  "/products",
  ...adminAuthentication,
  asyncHandler(AdminController.getAllProducts)
)

router.get(
  "/sellers",
  ...adminAuthentication,
  asyncHandler(AdminController.findAllSellers)
)
router.get(
  "/sellers/:id",
  ...adminAuthentication,
  validateObjectId,
  asyncHandler(AdminController.getSellerDetail)
)

router.get(
  "/customers",
  ...adminAuthentication,
  asyncHandler(AdminController.findAllCustomers)
)
router.get(
  "/customers/:id",
  validateObjectId,
  asyncHandler(AdminController.findCusomterOrders)
)
router.patch(
  "/customers/:id",
  ...adminAuthentication,
  validateObjectId,
  validate(UpdateUser),
  asyncHandler(AdminController.updateCustomer)
)

router.patch(
  "/sellers/:id",
  ...adminAuthentication,
  validateObjectId,
  validate(updateSellerSchema),
  asyncHandler(AdminController.editSeller)
)

router.patch(
  "/update-product/:id",
  ...adminAuthentication,
  validateObjectId,
  upload.single("image"),
  validateImageSignature(false),
  validate(updateProductSchema),
  asyncHandler(AdminController.updateProductByAdmin)
)
router.patch(
  "/orders/item-status",
  ...adminAuthentication,
  validate(updateSellerOrderItemStatusSchema),
  asyncHandler(AdminController.updateOrderItemStatusByAdmin)
)

router.delete(
  "/delete-product/:id",
  ...adminAuthentication,
  validateObjectId,
  asyncHandler(AdminController.deleteProductByAdmin)
)

export default router
