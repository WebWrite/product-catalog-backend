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
import authLimiter from "../middlewares/rateLimiting.js"

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

/**
 * @swagger
 * /api/v1/seller/activity-logs:
 *   get:
 *     tags: [Seller Dashboard]
 *     summary: Get seller activity logs
 *     security: [{ accessToken: [] }]
 *
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         example: 1
 *
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         example: 10
 *
 *       - in: query
 *         name: target
 *         schema:
 *           type: string
 *         example: Product
 *
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         example: created
 *
 *     responses:
 *       200:
 *         description: Seller activity logs retrieved successfully.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 logs:
 *                   - _id: "6ace757268adf5c6ba41f799"
 *                     action: PRODUCT_CREATED
 *                     target: Product
 *                     status: success
 *                     message: Seller created a product
 *                     requestId: "61de1ab0-dd50-4908-9291-3a8b6d18a722"
 *                     createdAt: "2026-10-13T18:16:18.476Z"
 *                 pagination:
 *                   page: 1
 *                   limit: 10
 *                   total: 35
 *                   totalPages: 4
 *
 */
/**
 * @swagger
 * /api/v1/seller/profile:
 *   get:
 *     tags: [Seller Dashboard]
 *     summary: Get seller profile
 *     responses:
 *       200:
 *         description: Seller profile retrieved successfully.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 name: Ali Seller
 *                 email: ali.seller@test.com
 *                 role: seller
 *                 createdAt: "2026-10-20T18:15:53.588Z"
 *                 sellerProfile:
 *                   storeName: Ali Clothing Store
 *                   storeType: Clothing
 *
 *   patch:
 *     tags: [Seller Dashboard]
 *     summary: Update seller profile
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             name: Ali Seller
 *             storeName: Ali Fashion Store
 *             storeType: Clothing
 *     responses:
 *       200:
 *         description: Seller profile updated successfully.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Seller profile updated successfully
 *               data:
 *                 name: Ali Seller
 *                 email: ali.seller@test.com
 *                 role: seller
 *                 createdAt: "2026-10-20T18:15:53.588Z"
 *                 sellerProfile:
 *                   storeName: Ali Fashion Store
 *                   storeType: Clothing
 *
 * /api/v1/seller/profile/password:
 *   patch:
 *     tags: [Seller Dashboard]
 *     summary: Change seller password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             newPassword: NewPassword@123
 *             confirmPassword: NewPassword@123
 *     responses:
 *       200:
 *         description: Password changed successfully.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Password changed successfully
 */
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
