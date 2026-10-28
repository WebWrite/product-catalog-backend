import { HTTP_STATUS } from "../constants/statusCodes.js"
import {
  getSellerDashboard,
  getSellerInventoryHealthManager,
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
