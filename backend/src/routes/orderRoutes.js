/**
 * ANNAPURNA Backend — Order Routes
 *
 * Customer routes:
 *   POST /api/orders/create-razorpay-order  — Create Razorpay order
 *   POST /api/orders/razorpay-webhook       — Razorpay server-to-server webhook (public, signature-verified)
 *   POST /api/orders                        — Place order (after payment)
 *   GET  /api/orders                        — Get my orders
 *   GET  /api/orders/:orderId               — Get single order
 *
 * Admin routes:
 *   GET  /api/admin/orders/stats            — Stats
 *   GET  /api/admin/orders                  — All orders (paginated)
 *   GET  /api/admin/orders/:orderId         — Single order details
 */

import { Router } from 'express';
import {
  createRazorpayOrder,
  razorpayWebhook,
  placeOrder,
  getMyOrders,
  getMyOrder,
  adminGetOrderStats,
  adminGetOrders,
  adminGetOrderDetails,
  adminUpdateOrderStatus,
  adminGetDashboardOverview,
  adminGetWeeklySales,
  adminGetTopSellingProducts,
} from '../controllers/orderController.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

export const orderRouter      = Router();
export const adminOrderRouter = Router();

// ── Customer routes ──────────────────────────────────────────────────────────
orderRouter.post('/create-razorpay-order', createRazorpayOrder);
orderRouter.post('/razorpay-webhook',      razorpayWebhook);
orderRouter.post('/',                      placeOrder);
orderRouter.get('/',                       getMyOrders);
orderRouter.get('/:orderId',               getMyOrder);

// ── Admin routes ─────────────────────────────────────────────────────────────
adminOrderRouter.use(requireAdmin);
adminOrderRouter.get('/stats',      adminGetOrderStats);
adminOrderRouter.get('/dashboard/overview',     adminGetDashboardOverview);
adminOrderRouter.get('/dashboard/weekly-sales', adminGetWeeklySales);
adminOrderRouter.get('/dashboard/top-selling',  adminGetTopSellingProducts);
adminOrderRouter.get('/',           adminGetOrders);
adminOrderRouter.patch('/:orderId/status', adminUpdateOrderStatus);
adminOrderRouter.get('/:orderId',   adminGetOrderDetails);
