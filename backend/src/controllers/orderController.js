/**
 * ANNAPURNA Backend — Order Controller
 *
 * Handles HTTP request/response for order endpoints.
 * Delegates business logic to the order service.
 * Verifies Cashfree payment status server-side for online payments —
 * a successful frontend redirect/checkout callback is never trusted alone.
 */

import { verifyUser } from '../config/supabase.js';
import {
  cashfreeConfigured,
  cashfreeCreateOrder,
  cashfreeFetchOrder,
  cashfreeFetchOrderPayments,
  verifyCashfreeWebhookSignature,
} from '../config/cashfree.js';
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
  syncPaymentFromCashfreeWebhook,
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
 * POST /api/orders/create-cashfree-order
 * Creates a Cashfree order (payment session) for online payment initiation.
 * Requires authentication.
 */
export async function createCashfreeOrder(req, res, next) {
  try {
    const token = extractBearerToken(req);
    if (!token) return res.status(401).json({ success: false, message: 'Unauthorised' });

    const user = await verifyUser(token);

    const { amount, currency = 'INR', customerName, customerPhone, returnUrl } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const orderId = `order_${user.id.slice(0, 8)}_${Date.now()}`;

    if (!cashfreeConfigured) {
      // Cashfree not configured — return a mock order for development
      console.warn('[OrderController] Cashfree not configured — returning mock order');
      return res.json({
        success: true,
        mock:    true,
        order: {
          order_id:           orderId,
          payment_session_id: `session_mock_${Date.now()}`,
          order_amount:       amount,
          order_currency:     currency,
        },
      });
    }

    const cfOrder = await cashfreeCreateOrder({
      orderId,
      amount,
      currency,
      customer: {
        id:    user.id,
        name:  customerName || undefined,
        email: user.email || undefined,
        phone: customerPhone || undefined,
      },
      returnUrl,
    });

    console.log(`[OrderController] Cashfree order created: ${cfOrder.order_id} for user: ${user.id}`);

    res.json({ success: true, order: cfOrder });
  } catch (err) {
    console.error('[OrderController] Cashfree order creation failed:', err.cashfreeResponse || err.message);
    return res.status(502).json({ success: false, message: 'Could not initiate payment. Please try again.' });
  }
}

/**
 * POST /api/orders
 * Complete order creation after payment.
 *
 * For online payments: verifies the Cashfree payment status server-side
 * (via the Cashfree API) before creating the order — the frontend's
 * checkout callback / redirect is never trusted on its own.
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
      // Online payment field — the Cashfree order_id returned by
      // create-cashfree-order, used to look up the real payment status.
      cashfreeOrderId,
    } = req.body;

    console.log(`[OrderController] Place order attempt — customer: ${customerId}, method: ${paymentMethod}`);

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }
    if (!shippingAddress) {
      return res.status(400).json({ success: false, message: 'Shipping address is required' });
    }

    let transactionId = null;

    // For online payments: verify the actual payment status with Cashfree before creating the order
    if (paymentMethod !== 'cod') {
      if (!cashfreeOrderId) {
        return res.status(400).json({ success: false, message: 'Payment reference is required for online payments' });
      }

      if (cashfreeConfigured) {
        let cfOrder;
        try {
          cfOrder = await cashfreeFetchOrder(cashfreeOrderId);
        } catch (err) {
          console.error(`[OrderController] Failed to fetch Cashfree order ${cashfreeOrderId}:`, err.cashfreeResponse || err.message);
          return res.status(502).json({ success: false, message: 'Could not verify payment. Please try again.' });
        }

        if (cfOrder.order_status !== 'PAID') {
          console.warn(`[OrderController] Cashfree order not paid — order: ${cashfreeOrderId}, status: ${cfOrder.order_status}`);
          return res.status(400).json({ success: false, message: 'Payment was not completed successfully.' });
        }

        const payments = await cashfreeFetchOrderPayments(cashfreeOrderId);
        const successfulPayment = payments.find(p => p.payment_status === 'SUCCESS');
        if (!successfulPayment) {
          console.error(`[OrderController] No successful payment found for Cashfree order: ${cashfreeOrderId}`);
          return res.status(400).json({ success: false, message: 'Payment verification failed.' });
        }

        transactionId = String(successfulPayment.cf_payment_id);
        console.log(`[OrderController] Cashfree payment verified: ${transactionId} for order: ${cashfreeOrderId}`);
      } else {
        // Cashfree not configured (dev/mock mode) — accept the mock reference as-is
        console.log(`[OrderController] Cashfree not configured — accepting mock payment: ${cashfreeOrderId}`);
        transactionId = cashfreeOrderId;
      }
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
    const { cashfreeOrderId } = req.body || {};
    console.error('[OrderController] Order creation failed:', {
      message:   err.message,
      paymentId: cashfreeOrderId || null,
    });
    return res.status(500).json({
      success: false,
      code:    'ORDER_CREATION_FAILED',
      paymentId: cashfreeOrderId || null,
      message: 'Unable to confirm order',
    });
  }
}

/**
 * POST /api/orders/cashfree-webhook
 * Cashfree server-to-server webhook (public — no customer auth; the request
 * is authenticated via HMAC signature verification instead).
 *
 * This is a defence-in-depth / reconciliation channel, NOT the primary order
 * confirmation path (that's placeOrder above, which already verifies the
 * payment before creating the order). This handler only ever UPDATES a
 * payment/order that already exists — it never creates a new order, since a
 * webhook payload has no cart/address/customer context to create one with.
 */
export async function cashfreeWebhook(req, res) {
  try {
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];
    const rawBody   = req.rawBody;

    if (!verifyCashfreeWebhookSignature(signature, rawBody, timestamp)) {
      console.error('[OrderController] Cashfree webhook signature verification failed');
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const { type, data } = req.body || {};
    const payment = data?.payment;

    let newPaymentStatus = null;
    if (type === 'PAYMENT_SUCCESS_WEBHOOK') newPaymentStatus = 'paid';
    else if (type === 'PAYMENT_FAILED_WEBHOOK' || type === 'PAYMENT_USER_DROPPED_WEBHOOK') newPaymentStatus = 'failed';
    else if (type === 'REFUND_STATUS_WEBHOOK') newPaymentStatus = 'refunded';

    const cfPaymentId = payment?.cf_payment_id ?? data?.refund?.cf_payment_id;

    if (newPaymentStatus && cfPaymentId) {
      const result = await syncPaymentFromCashfreeWebhook({
        transactionId: String(cfPaymentId),
        newPaymentStatus,
      });
      console.log(`[OrderController] Cashfree webhook processed — type: ${type}, payment: ${cfPaymentId}, result:`, result);
    } else {
      console.log(`[OrderController] Cashfree webhook ignored — unhandled type: ${type}`);
    }

    // Always acknowledge with 200 once the signature is valid — Cashfree
    // retries on any non-200 response, and a "no matching order yet" case
    // (order still being created by the primary flow) is not an error.
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('[OrderController] Cashfree webhook processing error:', err.message);
    // Still 200 — we've already logged it; returning an error would just
    // trigger pointless Cashfree retries for a webhook we choose not to act on.
    res.status(200).json({ success: false });
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
