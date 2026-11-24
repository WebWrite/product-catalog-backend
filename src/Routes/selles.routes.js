import { Router } from "express"
import allowedRoles from "../middlewares/allowedRoles.js"
import authentication from "../middlewares/authentication.middleware.js"
import { asyncHandler } from "../utils/wrapasync.js"
import {
  changeSellerPasswordController,
  getSellerActivityLogsController,
  getSellerDashboardController,
  getSellerInventoryHealthController,
  getSellerProfileController,
  getSellerSalesByMonthController,
  updateSellerProfileController
} from "../Controllers/selles.controller.js"
import {
  changeSellerPasswordValidation,
  sellerActivityLogsQuerySchema,
  updateSellerProfileValidation
} from "../validations/sellerValidation.js"
import validate from "../middlewares/validate.js"
import { sanitizeFields } from "../middlewares/sanitizeFields.middleware.js"
import authLimiter from "../middlewares/rateLimiting.js"

const router = Router()

const sellerAuthentication = [
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  allowedRoles("seller")
]

router.get(
  "/seller/dashboard",
  authLimiter(1, 30),
  ...sellerAuthentication,
  asyncHandler(getSellerDashboardController)
)

router.get(
  "/seller/sales/monthly",
  authLimiter(1, 30),
  ...sellerAuthentication,
  asyncHandler(getSellerSalesByMonthController)
)

router.get(
  "/seller/inventory-health",
  authLimiter(1, 30),
  ...sellerAuthentication,
  asyncHandler(getSellerInventoryHealthController)
)
router.get(
  "/seller/profile",
  authLimiter(1, 30),
  ...sellerAuthentication,
  asyncHandler(getSellerProfileController)
)

router.patch(
  "/seller/profile",
  authLimiter(1, 10),
  ...sellerAuthentication,
  sanitizeFields(["name", "storeName", "storeType"]),
  validate(updateSellerProfileValidation),
  asyncHandler(updateSellerProfileController)
)

router.patch(
  "/seller/profile/password",
  authLimiter(1, 10),
  ...sellerAuthentication,
  validate(changeSellerPasswordValidation),
  asyncHandler(changeSellerPasswordController)
)

router.get(
  "/user/activity-logs",
  authLimiter(1, 30),
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  validate(sellerActivityLogsQuerySchema),
  asyncHandler(getSellerActivityLogsController)
)

export default router
