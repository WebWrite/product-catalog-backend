import AdminDashboardRepository from "./admin.dashboard.repo.js"
import AdminOrdersRepository from "./admin.orders.repo.js"
import AdminSellersRepository from "./admin.sellers.repo.js"
import AdminCustomersRepository from "./admin.customers.repo.js"

class AdminRepository {}

AdminRepository.getActivityLogs = (...args) =>
  AdminDashboardRepository.getActivityLogs(...args)

AdminRepository.sumGrossValue = (...args) =>
  AdminDashboardRepository.sumGrossValue(...args)

AdminRepository.countOrder = (...args) =>
  AdminDashboardRepository.countOrder(...args)

AdminRepository.countSellers = (...args) =>
  AdminDashboardRepository.countSellers(...args)

AdminRepository.countAccounts = (...args) =>
  AdminDashboardRepository.countAccounts(...args)

AdminRepository.revenueByDay = (...args) =>
  AdminDashboardRepository.revenueByDay(...args)

AdminRepository.SalesByCategory = (...args) =>
  AdminDashboardRepository.SalesByCategory(...args)

AdminRepository.orderSummary = (...args) =>
  AdminDashboardRepository.orderSummary(...args)

AdminRepository.customerSummary = (...args) =>
  AdminDashboardRepository.customerSummary(...args)

AdminRepository.sellerSummary = (...args) =>
  AdminDashboardRepository.sellerSummary(...args)

AdminRepository.getOrder = (...args) => AdminOrdersRepository.getOrder(...args)

AdminRepository.findOrderById = (...args) =>
  AdminOrdersRepository.findOrderById(...args)

AdminRepository.productSummary = (...args) =>
  AdminOrdersRepository.productSummary(...args)

AdminRepository.updateProductByAdmin = (...args) =>
  AdminOrdersRepository.updateProductByAdmin(...args)

AdminRepository.deleteProductByAdmin = (...args) =>
  AdminOrdersRepository.deleteProductByAdmin(...args)

AdminRepository.findOrderItem = (...args) =>
  AdminOrdersRepository.findOrderItem(...args)

AdminRepository.updateOrderItemStatus = (...args) =>
  AdminOrdersRepository.updateOrderItemStatus(...args)

AdminRepository.findAllProducts = (...args) =>
  AdminOrdersRepository.findAllProducts(...args)

AdminRepository.allSellers = (...args) =>
  AdminSellersRepository.allSellers(...args)

AdminRepository.findOneSeller = (...args) =>
  AdminSellersRepository.findOneSeller(...args)

AdminRepository.editSeller = (...args) =>
  AdminSellersRepository.editSeller(...args)

AdminRepository.findCustomers = (...args) =>
  AdminCustomersRepository.findCustomers(...args)

AdminRepository.findOneCustomerOrder = (...args) =>
  AdminCustomersRepository.findOneCustomerOrder(...args)

AdminRepository.updateCustomer = (...args) =>
  AdminCustomersRepository.updateCustomer(...args)

export default AdminRepository
