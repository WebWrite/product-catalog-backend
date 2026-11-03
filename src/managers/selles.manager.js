import {
  findSellerProfileByUserId,
  getSellerInventoryHealth
} from "../repositories/product.repo.js"
import OrderRepository from "../repositories/order.repo.js"
import UserRepository from "../repositories/user.repo.js"
import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import SellerProfileRepository from "../repositories/sellerProfile.repo.js"
import ActivityLogRepository from "../repositories/activityLog.repo.js"

const getMonthStart = (date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))

const getLastSixMonths = (startDate, monthlySales) => {
  const salesByMonth = new Map(
    monthlySales.map((month) => [`${month._id.year}-${month._id.month}`, month])
  )

  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(
      Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth() + index, 1)
    )
    const year = date.getUTCFullYear()
    const monthNumber = date.getUTCMonth() + 1
    const month = salesByMonth.get(`${year}-${monthNumber}`)

    return {
      month: date.toLocaleString("en-US", {
        month: "long",
        timeZone: "UTC"
      }),
      year,
      orders: month?.orders || 0,
      sales: month?.sales || 0
    }
  })
}

export const getSellerDashboard = async (sellerId) => {
  const [productStats, orderStats] = await Promise.all([
    getSellerInventoryHealth(sellerId),
    OrderRepository.getSellerSalesStats(sellerId)
  ])

  const sales = orderStats[0] || { totalOrders: 0, totalSales: 0 }

  return {
    totalCatalogedProducts: productStats.totalProducts,
    totalOrders: sales.totalOrders,
    totalSales: sales.totalSales,
    lowStockCriticalItemCount: productStats.lowStock.count
  }
}

export const getSellerSalesByMonth = async (sellerId) => {
  const now = new Date()
  const currentMonth = getMonthStart(now)
  const startDate = new Date(
    Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth() - 5, 1)
  )
  const endDate = new Date(
    Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth() + 1, 1)
  )
  const monthlySales = await OrderRepository.getSellerMonthlySales(
    sellerId,
    startDate,
    endDate
  )
  return getLastSixMonths(startDate, monthlySales)
}

export const getSellerInventoryHealthManager = (sellerId) =>
  getSellerInventoryHealth(sellerId)

export const getSellerProfileManager = async (sellerId) => {
  const user = await UserRepository.findSellerWithProfile(sellerId)

  if (!user?.sellerProfile) return null

  return {
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    sellerProfile: {
      storeName: user.sellerProfile.storeName,
      storeType: user.sellerProfile.storeType
    }
  }
}

export const changeSellerPasswordManager = async (sellerId, newPassword) => {
  const hashedPassword = await bcrypt.hash(newPassword, 10)

  return UserRepository.updatePasswordById(sellerId, hashedPassword)
}

export const updateSellerProfileManager = async (sellerId, changes) => {
  const session = await mongoose.startSession()

  let updatedProfile = null

  try {
    await session.withTransaction(async () => {
      const user = await UserRepository.findSellerWithProfile(sellerId, session)

      if (!user?.sellerProfile) return

      const userChanges = {}
      const storeChanges = {}

      if (changes.name !== undefined) {
        userChanges.name = changes.name
      }

      if (changes.storeName !== undefined) {
        storeChanges.storeName = changes.storeName
      }

      if (changes.storeType !== undefined) {
        storeChanges.storeType = changes.storeType
      }

      if (Object.keys(userChanges).length) {
        await UserRepository.updateSellerById(sellerId, userChanges, session)
      }

      if (Object.keys(storeChanges).length) {
        await SellerProfileRepository.updateByUserId(
          sellerId,
          storeChanges,
          session
        )
      }

      const updatedUser = await UserRepository.findSellerWithProfile(
        sellerId,
        session
      )

      updatedProfile = {
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt,
        sellerProfile: {
          storeName: updatedUser.sellerProfile.storeName,
          storeType: updatedUser.sellerProfile.storeType
        }
      }
    })
  } finally {
    await session.endSession()
  }

  return updatedProfile
}

export const getSellerActivityLogsManager = (sellerId, filters) =>
  ActivityLogRepository.findSellerActivityLogs(sellerId, filters)
