import { HTTP_STATUS } from "../constants/statusCodes.js"
import {
  getSellerDashboard,
  getSellerInventoryHealthManager,
  getSellerProfileManager,
  getSellerSalesByMonth
} from "../managers/selles.manager.js"

export const getSellerDashboardController = async (req, res) => {
  const dashboard = await getSellerDashboard(req.user.id)

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: dashboard
  })
}

export const getSellerSalesByMonthController = async (req, res) => {
  const sales = await getSellerSalesByMonth(req.user.id)

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { sales }
  })
}

export const getSellerInventoryHealthController = async (req, res) => {
  const inventoryHealth = await getSellerInventoryHealthManager(req.user.id)

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: inventoryHealth
  })
}

export const getSellerProfileController = async (req, res) => {
  const profile = await getSellerProfileManager(req.user.id)

  if (!profile) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: "Seller profile not found"
    })
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: profile
  })
}
