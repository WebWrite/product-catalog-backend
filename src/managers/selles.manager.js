import { getSellerInventoryHealth } from "../repositories/product.repo.js"
import OrderRepository from "../repositories/order.repo.js"

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
