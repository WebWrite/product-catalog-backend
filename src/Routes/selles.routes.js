import { Router } from "express"
import allowedRoles from "../middlewares/allowedRoles.js"
import authentication from "../middlewares/authentication.middleware.js"
import { asyncHandler } from "../utils/wrapasync.js"
import {
  getSellerDashboardController,
  getSellerInventoryHealthController,
  getSellerSalesByMonthController
} from "../Controllers/selles.controller.js"

const router = Router()

const sellerAuthentication = [
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  allowedRoles("seller")
]

router.get(
  "/seller/dashboard",
  ...sellerAuthentication,
  asyncHandler(getSellerDashboardController)
)

router.get(
  "/seller/sales/monthly",
  ...sellerAuthentication,
  asyncHandler(getSellerSalesByMonthController)
)

router.get(
  "/seller/inventory-health",
  ...sellerAuthentication,
  asyncHandler(getSellerInventoryHealthController)
)

export default router
