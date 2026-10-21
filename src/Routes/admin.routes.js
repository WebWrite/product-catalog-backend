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

const router = Router()
router.get("/dashboard/summary", asyncHandler(AdminController.getSummary))
router.get("/dashboard/revenue", asyncHandler(AdminController.getRevenue))
router.get(
  "/dashboard/top-categories",
  asyncHandler(AdminController.getTopCategories)
)
router.get("/orders", asyncHandler(AdminController.findOrders))
router.get("/products/summary", asyncHandler(AdminController.productSummary))

router.get("/sellers", asyncHandler(AdminController.findAllSellers))
router.get(
  "/sellers/:id",
  validateObjectId,
  asyncHandler(AdminController.getSellerDetail)
)

router.get("/customers", asyncHandler(AdminController.findAllCustomers))
router.get(
  "/customers/:id",
  validateObjectId,
  asyncHandler(AdminController.findCusomterOrders)
)
router.patch(
  "/customers/:id",
  validateObjectId,
  validate(UpdateUser),
  asyncHandler(AdminController.updateCustomer)
)

router.patch(
  "/sellers/:id",
  validateObjectId,
  validate(updateSellerSchema),
  asyncHandler(AdminController.editSeller)
)

router.patch(
  "/update-product/:id",
  validateObjectId,
  upload.single("image"),
  validateImageSignature(false),
  validate(updateProductSchema),
  asyncHandler(AdminController.updateProductByAdmin)
)
router.patch(
  "/orders/item-status",
  validate(updateSellerOrderItemStatusSchema),
  asyncHandler(AdminController.updateOrderItemStatusByAdmin)
)

router.delete(
  "/delete-product/:id",
  validateObjectId,
  asyncHandler(AdminController.deleteProductByAdmin)
)

export default router
