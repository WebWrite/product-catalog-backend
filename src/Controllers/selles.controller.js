import { HTTP_STATUS } from "../constants/statusCodes.js"
import {
  changeSellerPasswordManager,
  getSellerActivityLogsManager,
  getSellerDashboard,
  getSellerInventoryHealthManager,
  getSellerProfileManager,
  getSellerSalesByMonth,
  updateSellerProfileManager
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

export const updateSellerProfileController = async (req, res) => {
  const profile = await updateSellerProfileManager(req.user.id, req.body)

  if (!profile) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: "Seller profile not found"
    })
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Seller profile updated successfully",
    data: profile
  })
}

export const changeSellerPasswordController = async (req, res) => {
  const { newPassword } = req.body

  const result = await changeSellerPasswordManager(req.user.id, newPassword)

  if (!result) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: "Seller account not found"
    })
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Password changed successfully"
  })
}

export const getSellerActivityLogsController = async (req, res) => {
  const { page = 1, limit = 10, target = "", search = "" } = req.query

  const filters = {
    page: Math.max(1, Number(page) || 1),
    limit: Math.min(50, Math.max(1, Number(limit) || 10)),
    target: target.trim(),
    search: search.trim()
  }

  const activityLogs = await getSellerActivityLogsManager(req.user.id, filters)

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: activityLogs
  })
}
