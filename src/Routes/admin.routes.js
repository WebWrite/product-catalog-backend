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
