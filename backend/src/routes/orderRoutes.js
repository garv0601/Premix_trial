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
import { createRateLimiter } from '../middleware/security.js';

export const orderRouter      = Router();
export const adminOrderRouter = Router();

// Generous per-IP limits on payment initiation + order placement — enough for
// normal checkout retries, but a ceiling against automated abuse. The Razorpay
// webhook is intentionally NOT limited (Razorpay retries and needs 200s).
const orderWriteLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: 'Too many requests. Please wait a moment and try again.',
});

// ── Customer routes ──────────────────────────────────────────────────────────
orderRouter.post('/create-razorpay-order', orderWriteLimiter, createRazorpayOrder);
orderRouter.post('/razorpay-webhook',      razorpayWebhook);
orderRouter.post('/',                      orderWriteLimiter, placeOrder);
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
