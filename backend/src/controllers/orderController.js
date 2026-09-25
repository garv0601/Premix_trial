/**
 * ANNAPURNA Backend — Order Controller
 *
 * Handles HTTP request/response for order endpoints.
 * Delegates business logic to the order service.
 * Verifies Razorpay payment status server-side for online payments —
 * a successful frontend checkout callback is never trusted alone.
 */

import { verifyUser } from '../config/supabase.js';
import {
  razorpayConfigured,
  razorpayKeyId,
  razorpayCreateOrder,
  razorpayFetchOrder,
  razorpayFetchOrderPayments,
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
} from '../config/razorpay.js';
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
  syncPaymentFromRazorpayWebhook,
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

    const { amount, currency = 'INR', customerName, customerPhone } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const receipt = `order_${user.id.slice(0, 8)}_${Date.now()}`;

    if (!razorpayConfigured) {
      // Razorpay not configured — return a mock order for development
      console.warn('[OrderController] Razorpay not configured — returning mock order');
      return res.json({
        success: true,
        mock:    true,
        order: {
          id:       receipt,
          amount:   Math.round(Number(amount) * 100),
          currency,
          receipt,
        },
      });
    }

    const rzpOrder = await razorpayCreateOrder({
      receipt,
      amount,
      currency,
      notes: {
        customer_id:    user.id,
        customer_name:  customerName || '',
        customer_phone: customerPhone || '',
        customer_email: user.email || '',
      },
    });

    console.log(`[OrderController] Razorpay order created: ${rzpOrder.id} for user: ${user.id}`);

    // razorpayKeyId is the PUBLIC key — safe to hand to the browser checkout SDK.
    res.json({ success: true, order: rzpOrder, keyId: razorpayKeyId });
  } catch (err) {
    console.error('[OrderController] Razorpay order creation failed:', err.razorpayResponse || err.message);
    return res.status(502).json({ success: false, message: 'Could not initiate payment. Please try again.' });
  }
}

/**
 * POST /api/orders
 * Complete order creation after payment.
 *
 * For online payments: verifies the Razorpay payment signature AND status
 * server-side (via the Razorpay API) before creating the order — the
 * frontend's checkout callback is never trusted on its own.
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
      // Online payment fields — returned by the Razorpay checkout handler and
      // used to verify the payment (signature) and look up its real status.
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

    // For online payments: verify the Razorpay payment before creating the order
    if (paymentMethod !== 'cod') {
      if (!razorpayOrderId) {
        return res.status(400).json({ success: false, message: 'Payment reference is required for online payments' });
      }

      if (razorpayConfigured) {
        if (!razorpayPaymentId || !razorpaySignature) {
          return res.status(400).json({ success: false, message: 'Payment reference is required for online payments' });
        }

        // 1. Verify the checkout callback signature — cryptographic proof that
        //    this payment id genuinely belongs to this order id.
        const signatureValid = verifyRazorpayPaymentSignature({
          orderId:   razorpayOrderId,
          paymentId: razorpayPaymentId,
          signature: razorpaySignature,
        });
        if (!signatureValid) {
          console.warn(`[OrderController] Razorpay signature verification failed — order: ${razorpayOrderId}`);
          return res.status(400).json({ success: false, message: 'Payment verification failed.' });
        }

        // 2. Independently confirm the order status with the Razorpay API —
        //    never trust the callback alone even after a valid signature.
        let rzpOrder;
        try {
          rzpOrder = await razorpayFetchOrder(razorpayOrderId);
        } catch (err) {
          console.error(`[OrderController] Failed to fetch Razorpay order ${razorpayOrderId}:`, err.razorpayResponse || err.message);
          return res.status(502).json({ success: false, message: 'Could not verify payment. Please try again.' });
        }

        if (rzpOrder.status !== 'paid') {
          console.warn(`[OrderController] Razorpay order not paid — order: ${razorpayOrderId}, status: ${rzpOrder.status}`);
          return res.status(400).json({ success: false, message: 'Payment was not completed successfully.' });
        }

        // 3. Confirm a captured payment exists for this order and matches the
        //    payment id returned by the checkout handler.
        const payments = await razorpayFetchOrderPayments(razorpayOrderId);
        const successfulPayment = payments.find(
          p => p.id === razorpayPaymentId && p.status === 'captured'
        );
        if (!successfulPayment) {
          console.error(`[OrderController] No captured payment found for Razorpay order: ${razorpayOrderId}`);
          return res.status(400).json({ success: false, message: 'Payment verification failed.' });
        }

        transactionId = String(successfulPayment.id);
        console.log(`[OrderController] Razorpay payment verified: ${transactionId} for order: ${razorpayOrderId}`);
      } else {
        // Razorpay not configured (dev/mock mode) — accept the mock reference as-is
        console.log(`[OrderController] Razorpay not configured — accepting mock payment: ${razorpayOrderId}`);
        transactionId = razorpayOrderId;
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
    const { razorpayOrderId } = req.body || {};
    console.error('[OrderController] Order creation failed:', {
      message:   err.message,
      paymentId: razorpayOrderId || null,
    });
    return res.status(500).json({
      success: false,
      code:    'ORDER_CREATION_FAILED',
      paymentId: razorpayOrderId || null,
      message: 'Unable to confirm order',
    });
  }
}

/**
 * POST /api/orders/razorpay-webhook
 * Razorpay server-to-server webhook (public — no customer auth; the request
 * is authenticated via HMAC signature verification instead).
 *
 * This is a defence-in-depth / reconciliation channel, NOT the primary order
 * confirmation path (that's placeOrder above, which already verifies the
 * payment before creating the order). This handler only ever UPDATES a
 * payment/order that already exists — it never creates a new order, since a
 * webhook payload has no cart/address/customer context to create one with.
 */
export async function razorpayWebhook(req, res) {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody   = req.rawBody;

    if (!verifyRazorpayWebhookSignature(signature, rawBody)) {
      console.error('[OrderController] Razorpay webhook signature verification failed');
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const { event, payload } = req.body || {};
    const paymentEntity = payload?.payment?.entity;
    const refundEntity  = payload?.refund?.entity;

    let newPaymentStatus = null;
    if (event === 'payment.captured') newPaymentStatus = 'paid';
    else if (event === 'payment.failed') newPaymentStatus = 'failed';
    else if (event === 'refund.processed' || event === 'refund.created') newPaymentStatus = 'refunded';

    // The Razorpay payment id is our stored transaction_id.
    const rzpPaymentId = paymentEntity?.id ?? refundEntity?.payment_id;

    if (newPaymentStatus && rzpPaymentId) {
      const result = await syncPaymentFromRazorpayWebhook({
        transactionId: String(rzpPaymentId),
        newPaymentStatus,
      });
      console.log(`[OrderController] Razorpay webhook processed — event: ${event}, payment: ${rzpPaymentId}, result:`, result);
    } else {
      console.log(`[OrderController] Razorpay webhook ignored — unhandled event: ${event}`);
    }

    // Always acknowledge with 200 once the signature is valid — Razorpay
    // retries on any non-200 response, and a "no matching order yet" case
    // (order still being created by the primary flow) is not an error.
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('[OrderController] Razorpay webhook processing error:', err.message);
    // Still 200 — we've already logged it; returning an error would just
    // trigger pointless Razorpay retries for a webhook we choose not to act on.
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
