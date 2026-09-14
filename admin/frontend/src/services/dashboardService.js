/**
 * Dashboard data service for ANNPURNA Admin.
 *
 * Deliberately reuses the SAME data sources as the rest of the admin app
 * instead of inventing parallel queries/business rules:
 *   - Sales/Orders KPIs + Weekly chart + Top Selling → new backend endpoints
 *     under /api/admin/orders/dashboard/* (backend/src/services/orderService.js),
 *     which own the order/order_items business logic (cancelled orders never
 *     count as a sale or a valid order — see that file for the full rule).
 *   - New Customers → services/customerService.js getCustomerStats(), the
 *     exact same call the Customers page uses (7-day window).
 *   - Active Products / Low Stock → services/productService.js getProducts(),
 *     the exact same call the Products page uses, reusing its existing
 *     deriveStatus() low-stock threshold instead of inventing a new one.
 *   - Recent Orders → services/orderService.js getOrders(), the exact same
 *     call/endpoint the Orders page uses (page 1, small page size).
 */

import { supabase } from '../lib/supabase';
import { API_BASE_URL } from '../lib/apiConfig';
import { getCustomerStats } from './customerService';
import { getProducts, deriveStatus } from './productService';
import { getOrders } from './orderService';
import { formatRecentOrderDate } from '../utils/timeAgo';

// Locally, the Vite dev proxy forwards /api → http://localhost:5000/api
// (via VITE_BACKEND_URL in .env). In production this resolves to the
// deployed backend's public base URL — see lib/apiConfig.js.
const BACKEND_API = API_BASE_URL;

async function getAdminToken() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}

async function authedGet(path) {
  const token = await getAdminToken();
  const res = await fetch(`${BACKEND_API}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok || body?.success === false) {
    throw new Error(body?.message || 'Request failed. Please try again.');
  }

  return body;
}

/**
 * Fetch KPI stats for the dashboard overview.
 */
export async function getDashboardStats() {
  const [overviewBody, customerStats, products] = await Promise.all([
    authedGet('/admin/orders/dashboard/overview'),
    getCustomerStats(),
    getProducts(),
  ]);

  const overview = overviewBody.overview || {};
  const activeProducts = products.filter((p) => p.is_active).length;
  const lowStockCount = products.filter(
    (p) => deriveStatus(p.is_active, p.stock_quantity) === 'low_stock'
  ).length;

  return {
    totalSales: overview.totalSales || 0,
    salesTrendPercent: overview.salesTrendPercent || 0,
    salesTrendDirection: overview.salesTrendDirection || 'steady',
    totalOrders: overview.totalOrders || 0,
    ordersTrendPercent: overview.ordersTrendPercent || 0,
    ordersTrendDirection: overview.ordersTrendDirection || 'steady',
    newCustomers: customerStats.new_customers || 0,
    customersTrendPercent: customerStats.new_customers_trend_percent || 0,
    customersTrendDirection: customerStats.new_customers_trend_direction || 'steady',
    activeProducts,
    productsNeedingAttention: lowStockCount,
  };
}

/**
 * Fetch weekly sales data for the chart (Mon → Sun, current week).
 */
export async function getWeeklySales() {
  const { weeklySales } = await authedGet('/admin/orders/dashboard/weekly-sales');
  return weeklySales || [];
}

/**
 * Fetch products with low stock levels (reuses the Products page's own
 * active + low-stock definition — see productService.deriveStatus).
 */
export async function getLowStockProducts() {
  const products = await getProducts();
  return products
    .filter((p) => deriveStatus(p.is_active, p.stock_quantity) === 'low_stock')
    .sort((a, b) => a.stock_quantity - b.stock_quantity)
    .map((p) => ({ id: p.id, name: p.name, stock: p.stock_quantity }));
}

/**
 * Fetch top-selling products (actual quantity sold from order_items).
 */
export async function getTopSellingProducts() {
  const { products } = await authedGet('/admin/orders/dashboard/top-selling?limit=5');
  return products || [];
}

/**
 * Fetch recent orders for the dashboard table (same endpoint as the Orders page).
 */
export async function getRecentOrders() {
  const { orders } = await getOrders({ page: 1, pageSize: 5 });
  return (orders || []).map((o) => ({
    orderId: o.orderId,
    customer: o.customer?.fullName || 'Unknown Customer',
    date: formatRecentOrderDate(o.createdAt),
    amount: o.amount || 0,
    status: o.status,
  }));
}
