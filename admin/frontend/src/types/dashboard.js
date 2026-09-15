/**
 * Dashboard data types for ANNAPURNA Admin.
 * These mirror the shapes that will come from Supabase queries.
 */

/**
 * @typedef {Object} DashboardStats
 * @property {number} totalSales
 * @property {string} salesTrend
 * @property {number} salesTrendPercent
 * @property {number} totalOrders
 * @property {string} ordersTrend
 * @property {number} ordersTrendPercent
 * @property {number} newCustomers
 * @property {string} customersTrend
 * @property {number} activeProducts
 * @property {number} productsNeedingAttention
 */

/**
 * @typedef {Object} WeeklySalesData
 * @property {string} day
 * @property {number} sales
 * @property {number} orders
 */

/**
 * @typedef {Object} LowStockProduct
 * @property {string} id
 * @property {string} name
 * @property {number} stock
 */

/**
 * @typedef {Object} TopSellingProduct
 * @property {string} id
 * @property {string} name
 * @property {number} price
 * @property {number} sold
 * @property {string} [image]
 */

/**
 * @typedef {'preparing'|'shipped'|'delivered'|'cancelled'} OrderStatus
 */

/**
 * @typedef {Object} RecentOrder
 * @property {string} orderId
 * @property {string} customer
 * @property {string} date
 * @property {number} amount
 * @property {OrderStatus} status
 */

export default {};
