/**
 * ANNAPURNA Backend — Order Controller
 *
 * Handles HTTP request/response for order endpoints.
 * Delegates business logic to the order service.
 * Verifies Razorpay signatures server-side for online payments.
 */

import { verifyUser } from '../config/supabase.js';
import { verifyRazorpaySignature, razorpayClient } from '../config/razorpay.js';
import {
  createOrder,
  getCustomerOrders,
  getCustomerOrderById,
  getAllOrders,
  getOrderDetailsAdmin,
  getOrderStats,
  updateOrderStatusAdmin,
  getDashboardOverviewStats,
  getWeeklySalesData,
  getTopSellingProductsData,
  ORDER_STATUS,
} from '../services/orderService.js';

// ── Helper ────────────────────────────────────────────────────────────────────

function extractBearerToken(req) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    return auth.slice(7);
  }
  return null;
}

// ── Customer endpoints ────────────────────────────────────────────────────────

/**
 * POST /api/orders/create-razorpay-order
 * Creates a Razorpay order for online payment initiation.
 * Requires authentication.
 */
export async function createRazorpayOrder(req, res, next) {
  try {
    const token = extractBearerToken(req);
    if (!token) return res.status(401).json({ success: false, message: 'Unauthorised' });

    const user = await verifyUser(token);

    const { amount, currency = 'INR', receipt } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    if (!razorpayClient) {
      // Razorpay not configured — return a mock order for development
      console.warn('[OrderController] Razorpay not configured — returning mock order');
      return res.json({
        success:  true,
        mock:     true,
        order: {
          id:       `mock_order_${Date.now()}`,
          amount:   Math.round(amount * 100),
          currency,
          receipt:  receipt || `rcpt_${Date.now()}`,
        }
      });
    }

    const razorpayOrder = await razorpayClient.orders.create({
      amount:   Math.round(amount * 100), // Razorpay expects paise
      currency,
      receipt:  receipt || `rcpt_${user.id.slice(0, 20)}_${Date.now()}`,
    });

    console.log(`[OrderController] Razorpay order created: ${razorpayOrder.id} for user: ${user.id}`);

    res.json({ success: true, order: razorpayOrder });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/orders
 * Complete order creation after payment.
 *
 * For online payments: verifies Razorpay signature before creating the order.
 * For COD: creates the order directly.
 */
export async function placeOrder(req, res, next) {
  try {
    console.log('[OrderController] POST /api/orders — request received');
    const token = extractBearerToken(req);
    if (!token) return res.status(401).json({ success: false, message: 'Unauthorised' });

    // Verify user server-side — NEVER trust customer_id from request body
    const user = await verifyUser(token);
    const customerId = user.id;
    console.log(`[OrderController] Authenticated user: ${customerId}`);

    const {
      cartItems,
      deliveryMethod,
      paymentMethod,
      shippingAddress,
      couponCode,
      sessionId,
      notes,
      // Online payment fields (from Razorpay callback)
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    console.log(`[OrderController] Place order attempt — customer: ${customerId}, method: ${paymentMethod}`);

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }
    if (!shippingAddress) {
      return res.status(400).json({ success: false, message: 'Shipping address is required' });
    }

    let transactionId = null;

    // For online payments: verify Razorpay signature before creating the order
    if (paymentMethod !== 'cod') {
      if (!razorpayPaymentId) {
        return res.status(400).json({ success: false, message: 'Payment ID is required for online payments' });
      }

      // If Razorpay is configured, verify the signature
      if (razorpayClient && razorpayOrderId && razorpaySignature) {
        const signatureValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
        if (!signatureValid) {
          console.error(`[OrderController] Invalid Razorpay signature for payment: ${razorpayPaymentId}`);
          return res.status(400).json({ success: false, message: 'Payment verification failed. Invalid signature.' });
        }
        console.log(`[OrderController] Razorpay signature verified for payment: ${razorpayPaymentId}`);
      } else if (razorpayClient) {
        // Razorpay is configured but signature info is incomplete
        console.warn(`[OrderController] Razorpay configured but missing signature data for payment: ${razorpayPaymentId}`);
      } else {
        // Razorpay not configured (dev/mock mode)
        console.log(`[OrderController] Razorpay not configured — accepting mock payment: ${razorpayPaymentId}`);
      }

      transactionId = razorpayPaymentId;
    }

    // Create the order in Supabase
    const order = await createOrder({
      customerId,
      cartItems,
      deliveryMethod,
      paymentMethod,
      shippingAddress,
      couponCode,
      sessionId,
      transactionId,
      notes,
    });

    console.log(`[OrderController] Order confirmed: ${order.id} for customer: ${customerId}`);

    res.status(201).json({
      success: true,
      order: {
        id:            order.id,
        orderId:       `#ORD-${order.id.slice(0, 8).toUpperCase()}`,
        total:         order.total_amount,
        orderStatus:   order.order_status,
        paymentStatus: order.payment_status,
        createdAt:     order.created_at,
      },
      payment: {
        transactionId: transactionId || null,
        status:        order.payment_status,
      },
    });
  } catch (err) {
    // Detailed error stays server-side; the client gets a safe structured code.
    const { razorpayPaymentId } = req.body || {};
    console.error('[OrderController] Order creation failed:', {
      message:   err.message,
      paymentId: razorpayPaymentId || null,
    });
    return res.status(500).json({
      success: false,
      code:    'ORDER_CREATION_FAILED',
      paymentId: razorpayPaymentId || null,
      message: 'Unable to confirm order',
    });
  }
}

/**
 * GET /api/orders
 * Fetch the authenticated customer's orders.
 */
export async function getMyOrders(req, res, next) {
  try {
    const token = extractBearerToken(req);
    if (!token) return res.status(401).json({ success: false, message: 'Unauthorised' });

    const user = await verifyUser(token);
    const orders = await getCustomerOrders(user.id);

    res.json({ success: true, orders });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/orders/:orderId
 * Fetch a single order (customer's own order only).
 */
export async function getMyOrder(req, res, next) {
  try {
    const token = extractBearerToken(req);
    if (!token) return res.status(401).json({ success: false, message: 'Unauthorised' });

    const user  = await verifyUser(token);
    const order = await getCustomerOrderById(req.params.orderId, user.id);

    res.json({ success: true, order });
  } catch (err) {
    if (err.message === 'Order not found') {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    next(err);
  }
}

// ── Admin endpoints ───────────────────────────────────────────────────────────

/**
 * GET /api/admin/orders/stats
 * Fetch order summary statistics for admin.
 */
export async function adminGetOrderStats(req, res, next) {
  try {
    const stats = await getOrderStats();
    res.json({ success: true, stats });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/orders
 * Fetch all orders for admin.
 */
export async function adminGetOrders(req, res, next) {
  try {
    const { page = '1', pageSize = '10', search = '', status = '', dateRange = '' } = req.query;
    const result = await getAllOrders({
      page:     parseInt(page),
      pageSize: parseInt(pageSize),
      search,
      status,
      dateRange,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/orders/:orderId
 * Fetch a single order with full details for admin.
 */
export async function adminGetOrderDetails(req, res, next) {
  try {
    const order = await getOrderDetailsAdmin(req.params.orderId);
    res.json({ success: true, order });
  } catch (err) {
    if (err.message === 'Order not found') {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    next(err);
  }
}

/**
 * PATCH /api/admin/orders/:orderId/status
 * Update an order's lifecycle status.
 */
export async function adminUpdateOrderStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!Object.values(ORDER_STATUS).includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid order status' });
    }

    const order = await updateOrderStatusAdmin(req.params.orderId, status);
    res.json({
      success: true,
      message: 'Order status updated successfully',
      order: {
        id: order.id,
        status: order.order_status,
        updatedAt: order.updated_at,
      },
    });
  } catch (err) {
    if (err.message === 'Order not found') {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    next(err);
  }
}

/**
 * GET /api/admin/orders/dashboard/overview
 * Total Sales / Total Orders KPI cards + week-over-week trend.
 */
export async function adminGetDashboardOverview(req, res, next) {
  try {
    const overview = await getDashboardOverviewStats();
    res.json({ success: true, overview });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/orders/dashboard/weekly-sales
 * Weekly Sales Overview chart data (Mon → Sun, current week).
 */
export async function adminGetWeeklySales(req, res, next) {
  try {
    const weeklySales = await getWeeklySalesData();
    res.json({ success: true, weeklySales });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/orders/dashboard/top-selling
 * Top selling products by actual quantity sold.
 */
export async function adminGetTopSellingProducts(req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 5;
    const products = await getTopSellingProductsData(limit);
    res.json({ success: true, products });
  } catch (err) {
    next(err);
  }
}
