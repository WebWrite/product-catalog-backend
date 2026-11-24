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
import { sanitizeRichText } from "../middlewares/sanitizeRichText.middleware.js"
import { sanitizeFields } from "../middlewares/sanitizeFields.middleware.js"
import authLimiter from "../middlewares/rateLimiting.js"

const router = Router()
const adminAuthentication = [
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  authorization("admin")
]

const adminAnalyticsLimiter = authLimiter(1, 120)
const adminWriteLimiter = authLimiter(1, 40)

router.get(
  "/activity-logs",
  adminAnalyticsLimiter,
  ...adminAuthentication,
  asyncHandler(AdminController.getActivityLogs)
)

router.get(
  "/dashboard/summary",
  adminAnalyticsLimiter,
  ...adminAuthentication,
  asyncHandler(AdminController.getSummary)
)
router.get(
  "/dashboard/revenue",
  adminAnalyticsLimiter,
  ...adminAuthentication,
  asyncHandler(AdminController.getRevenue)
)
router.get(
  "/dashboard/top-categories",
  adminAnalyticsLimiter,
  ...adminAuthentication,
  asyncHandler(AdminController.getTopCategories)
)
router.get(
  "/order-summary",
  adminAnalyticsLimiter,
  ...adminAuthentication,
  asyncHandler(AdminController.getOrderSummary)
)
router.get(
  "/customer-summary",
  adminAnalyticsLimiter,
  ...adminAuthentication,
  asyncHandler(AdminController.getCustomerSummary)
)
router.get(
  "/seller-summary",
  adminAnalyticsLimiter,
  ...adminAuthentication,
  asyncHandler(AdminController.getSellerSummary)
)
router.get(
  "/order/:id",
  adminAnalyticsLimiter,
  ...adminAuthentication,
  validateObjectId,
  asyncHandler(AdminController.findOrderById)
)
router.get(
  "/orders",
  adminAnalyticsLimiter,
  ...adminAuthentication,
  asyncHandler(AdminController.findOrders)
)
router.get(
  "/products/summary",
  adminAnalyticsLimiter,
  ...adminAuthentication,
  asyncHandler(AdminController.productSummary)
)
router.get(
  "/products",
  adminAnalyticsLimiter,
  ...adminAuthentication,
  asyncHandler(AdminController.getAllProducts)
)

router.get(
  "/sellers",
  adminAnalyticsLimiter,
  ...adminAuthentication,
  asyncHandler(AdminController.findAllSellers)
)
router.get(
  "/sellers/:id",
  adminAnalyticsLimiter,
  ...adminAuthentication,
  validateObjectId,
  asyncHandler(AdminController.getSellerDetail)
)

router.get(
  "/customers",
  adminAnalyticsLimiter,
  ...adminAuthentication,
  asyncHandler(AdminController.findAllCustomers)
)
router.get(
  "/customers/:id",
  adminAnalyticsLimiter,
  ...adminAuthentication,
  validateObjectId,
  asyncHandler(AdminController.findCusomterOrders)
)
router.patch(
  "/customers/:id",
  adminWriteLimiter,
  ...adminAuthentication,
  validateObjectId,
  sanitizeFields(["name"]),
  validate(UpdateUser),
  asyncHandler(AdminController.updateCustomer)
)

router.patch(
  "/sellers/:id",
  adminWriteLimiter,
  ...adminAuthentication,
  validateObjectId,
  sanitizeFields(["name", "storeName", "storeType"]),
  validate(updateSellerSchema),
  asyncHandler(AdminController.editSeller)
)

router.patch(
  "/update-product/:id",
  adminWriteLimiter,
  ...adminAuthentication,
  validateObjectId,
  upload.single("image"),
  validateImageSignature(false),
  sanitizeFields(["category", "name"]),
  validate(updateProductSchema),
  sanitizeRichText("description"),
  asyncHandler(AdminController.updateProductByAdmin)
)
router.patch(
  "/orders/item-status",
  adminWriteLimiter,
  ...adminAuthentication,
  validate(updateSellerOrderItemStatusSchema),
  asyncHandler(AdminController.updateOrderItemStatusByAdmin)
)

router.delete(
  "/delete-product/:id",
  adminWriteLimiter,
  ...adminAuthentication,
  validateObjectId,
  asyncHandler(AdminController.deleteProductByAdmin)
)

export default router
