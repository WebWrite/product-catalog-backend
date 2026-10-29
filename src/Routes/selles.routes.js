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

/**
 * @swagger
 * /api/v1/seller/dashboard:
 *   get:
 *     tags: [Seller Dashboard]
 *     summary: Get seller dashboard data
 *     security: [{ accessToken: [] }]
 *     responses:
 *       200: { description: Seller dashboard }
 *
 * /api/v1/seller/sales/monthly:
 *   get:
 *     tags: [Seller Dashboard]
 *     summary: Get monthly seller sales
 *     security: [{ accessToken: [] }]
 *     responses:
 *       200: { description: Monthly sales }
 *
 * /api/v1/seller/inventory-health:
 *   get:
 *     tags: [Seller Dashboard]
 *     summary: Get seller inventory health
 *     security: [{ accessToken: [] }]
 *     responses:
 *       200: { description: Inventory health }
 */
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
