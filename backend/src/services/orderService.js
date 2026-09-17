/**
 * ANNAPURNA Backend — Order Service
 *
 * Handles all order-related database operations using the Supabase admin client.
 * All totals are calculated server-side — frontend values are ignored.
 *
 * DB Column note: the orders shipping column is `shipping_address`
 * (verified against the live schema). See DATABASE_SCHEMA.md.
 */

import { supabaseAdmin } from '../config/supabase.js';
import { computeTrend } from '../utils/trend.js';

// ── Business rules ───────────────────────────────────────────────────────────
const COD_FEE         = 40;     // ₹40 COD convenience fee
const EXPRESS_COST    = 50;     // ₹50 express shipping
const STANDARD_DELIVERY_THRESHOLD = 200; // subtotal >= this -> free standard delivery
const STANDARD_DELIVERY_CHARGE    = 20;  // charged when subtotal is below the threshold
const CURRENCY        = 'INR';

// ── Status values (matching DB enums/conventions already in use) ──────────────
export const ORDER_STATUS = {
  PENDING:    'pending',
  CONFIRMED:  'confirmed',
  PROCESSING: 'processing',
  SHIPPED:    'shipped',
  DELIVERED:  'delivered',
  CANCELLED:  'cancelled',
};

export const PAYMENT_STATUS = {
  PENDING:  'pending',
  PAID:     'paid',
  FAILED:   'failed',
  REFUNDED: 'refunded',
};

export const PAYMENT_METHOD = {
  UPI:  'upi',
  CARD: 'card',
  COD:  'cod',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Fetch current products from Supabase and validate the cart items.
 * Returns enriched items with server-side price/name.
 */
async function fetchAndValidateCartItems(cartItems) {
  const productIds = cartItems.map(item => item.product_id);

  const { data: products, error } = await supabaseAdmin
    .from('products')
    .select('id, name, price, stock_quantity, is_active')
    .in('id', productIds);

  if (error) {
    console.error('[OrderService] Product fetch error:', error);
    throw new Error('Failed to fetch product information');
  }

  const validatedItems = [];

  for (const cartItem of cartItems) {
    const product = products.find(p => p.id === cartItem.product_id);

    if (!product) {
      throw new Error(`Product not found: ${cartItem.product_id}`);
    }
    if (!product.is_active) {
      throw new Error(`Product is unavailable: ${product.name}`);
    }
    if (cartItem.quantity <= 0 || !Number.isInteger(cartItem.quantity)) {
      throw new Error(`Invalid quantity for product: ${product.name}`);
    }

    validatedItems.push({
      product_id:    product.id,
      product_name:  product.name,    // snapshot — not trusting frontend
      product_price: product.price,   // snapshot — not trusting frontend
      quantity:      cartItem.quantity,
      subtotal:      Number((product.price * cartItem.quantity).toFixed(2)),
    });
  }

  return validatedItems;
}

/**
 * Validate and fetch a coupon. Returns null if no coupon code provided.
 */
async function validateCoupon(couponCode, subtotal, customerId) {
  if (!couponCode) return null;

  const { data: coupon, error } = await supabaseAdmin
    .from('coupons')
    .select('*')
    .eq('code', couponCode.toUpperCase())
    .eq('is_active', true)
    .single();

  if (error || !coupon) {
    throw new Error('Invalid or expired coupon code');
  }

  const now = new Date();
  if (coupon.starts_at && new Date(coupon.starts_at) > now) {
    throw new Error('Coupon is not yet active');
  }
  if (coupon.expires_at && new Date(coupon.expires_at) < now) {
    throw new Error('Coupon has expired');
  }
  if (coupon.usage_limit && (coupon.used_count || 0) >= coupon.usage_limit) {
    throw new Error('Coupon usage limit reached');
  }
  if (coupon.minimum_order_amount && subtotal < coupon.minimum_order_amount) {
    throw new Error(`Minimum order of ₹${coupon.minimum_order_amount} required for this coupon`);
  }

  // Check per-customer usage
  const { count } = await supabaseAdmin
    .from('coupon_usage')
    .select('id', { count: 'exact', head: true })
    .eq('coupon_id', coupon.id)
    .eq('customer_id', customerId);

  if (count > 0) {
    throw new Error('You have already used this coupon');
  }

  return coupon;
}

/**
 * Calculate server-side totals.
 */
function calculateTotals(validatedItems, coupon, deliveryMethod, paymentMethod) {
  const subtotal = validatedItems.reduce((sum, item) => sum + item.subtotal, 0);

  let discountAmount = 0;
  if (coupon) {
    // Admin UI stores 'percentage'; accept legacy 'percent' too — both mean the same thing.
    if (coupon.discount_type === 'percentage' || coupon.discount_type === 'percent') {
      discountAmount = (subtotal * coupon.discount_value) / 100;
      if (coupon.maximum_discount) {
        discountAmount = Math.min(discountAmount, coupon.maximum_discount);
      }
    } else {
      // flat discount
      discountAmount = coupon.discount_value;
    }
    discountAmount = Math.min(discountAmount, subtotal); // can't discount more than subtotal
    discountAmount = Number(discountAmount.toFixed(2));
  }

  const shippingAmount = deliveryMethod === 'express'
    ? EXPRESS_COST
    : (subtotal >= STANDARD_DELIVERY_THRESHOLD ? 0 : STANDARD_DELIVERY_CHARGE);
  const codFee         = paymentMethod  === 'cod'     ? COD_FEE      : 0;
  // Prices are tax-inclusive — total mirrors the Cart/Checkout formula exactly:
  // Total = Subtotal + Shipping - Discount (+ COD fee, a separate payment surcharge).
  const taxAmount      = 0;
  const totalAmount    = Number((subtotal - discountAmount + shippingAmount + codFee).toFixed(2));

  return { subtotal, discountAmount, shippingAmount: shippingAmount + codFee, taxAmount, totalAmount };
}

// ── Main order creation ──────────────────────────────────────────────────────

/**
 * Create a complete order atomically in Supabase.
 *
 * Steps:
 * 1. Validate authenticated customer
 * 2. Fetch + validate products server-side
 * 3. Validate coupon (if any)
 * 4. Calculate totals server-side
 * 5. Confirm inventory reservation
 * 6. Create order record
 * 7. Create order_items records
 * 8. Create payment record
 *
 * @param {object} params
 * @param {string}   params.customerId      Verified Supabase user ID (from JWT, NOT frontend)
 * @param {Array}    params.cartItems        [{product_id, quantity}]
 * @param {string}   params.deliveryMethod   'standard' | 'express'
 * @param {string}   params.paymentMethod    'upi' | 'card' | 'cod'
 * @param {object}   params.shippingAddress  Address object
 * @param {string}   [params.couponCode]     Optional coupon code
 * @param {string}   [params.sessionId]      Inventory reservation session ID
 * @param {string}   [params.transactionId]  Cashfree payment ID / cf_payment_id (for online payments)
 * @param {string}   [params.notes]          Customer notes
 */
export async function createOrder({
  customerId,
  cartItems,
  deliveryMethod,
  paymentMethod,
  shippingAddress,
  couponCode,
  sessionId,
  transactionId,
  notes,
}) {
  console.log(`[OrderService] Creating order for customer: ${customerId}, method: ${paymentMethod}`);

  if (!supabaseAdmin) throw new Error('Database not configured');
  if (!customerId)    throw new Error('Unauthenticated: customer ID is required');
  if (!cartItems || cartItems.length === 0) throw new Error('Cart is empty');

  // 1. Verify customer exists in Profiles table
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('Profiles')
    .select('id')
    .eq('id', customerId)
    .single();

  if (profileError || !profile) {
    console.error('[OrderService] Profile not found:', profileError);
    throw new Error('Customer profile not found');
  }
  console.log(`[OrderService] Profile resolved: ${profile.id}`);

  // 1b. If the shipping address references a saved address row, confirm it belongs to this customer
  if (shippingAddress?.id) {
    const { data: addressRow, error: addressError } = await supabaseAdmin
      .from('addresses')
      .select('id')
      .eq('id', shippingAddress.id)
      .eq('customer_id', customerId)
      .maybeSingle();

    if (addressError || !addressRow) {
      console.error('[OrderService] Address validation failed:', addressError);
      throw new Error('Selected address not found or does not belong to you');
    }
    console.log(`[OrderService] Address validated: ${addressRow.id}`);
  }

  // 2. Fetch + validate products server-side
  const validatedItems = await fetchAndValidateCartItems(cartItems);
  console.log(`[OrderService] Validated ${validatedItems.length} cart items`);

  // 3. Validate coupon
  const coupon = await validateCoupon(couponCode, validatedItems.reduce((s, i) => s + i.subtotal, 0), customerId);
  if (coupon) console.log(`[OrderService] Coupon applied: ${coupon.code}`);

  // 4. Calculate totals server-side
  const { subtotal, discountAmount, shippingAmount, taxAmount, totalAmount } =
    calculateTotals(validatedItems, coupon, deliveryMethod, paymentMethod);

  console.log(`[OrderService] Totals — subtotal: ${subtotal}, discount: ${discountAmount}, shipping: ${shippingAmount}, tax: ${taxAmount}, total: ${totalAmount}`);

  // 5. Duplicate order check for online payments (idempotency)
  if (transactionId) {
    const { data: existingPayment } = await supabaseAdmin
      .from('payments')
      .select('id, order_id')
      .eq('transaction_id', transactionId)
      .maybeSingle();

    if (existingPayment) {
      console.warn(`[OrderService] Duplicate payment detected: ${transactionId}. Returning existing order.`);
      const { data: existingOrder } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('id', existingPayment.order_id)
        .single();
      return existingOrder;
    }
  }

  // 6. Determine payment/order status
  const isCOD = paymentMethod === 'cod';
  const orderStatus   = isCOD ? ORDER_STATUS.CONFIRMED : ORDER_STATUS.CONFIRMED;
  const paymentStatus = isCOD ? PAYMENT_STATUS.PENDING : PAYMENT_STATUS.PAID;

  // 7. Format shipping address as JSONB
  const shippingAddressJson = {
    full_name:     shippingAddress.fullName || shippingAddress.full_name,
    phone:         shippingAddress.phone,
    address_line1: shippingAddress.addressLine1 || shippingAddress.address_line1,
    address_line2: shippingAddress.addressLine2 || shippingAddress.address_line2 || null,
    city:          shippingAddress.city,
    state:         shippingAddress.state,
    postal_code:   shippingAddress.postalCode || shippingAddress.postal_code,
  };

  // 8. Insert order record
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      customer_id:     customerId,
      subtotal:        subtotal,
      discount_amount: discountAmount,
      shipping_amount: shippingAmount,
      tax_amount:      taxAmount,
      total_amount:    totalAmount,
      coupon_id:       coupon?.id || null,
      payment_status:  paymentStatus,
      order_status:    orderStatus,
      shipping_address: shippingAddressJson,
      notes:           notes || '', // orders.notes is NOT NULL in the live DB
    })
    .select('*')
    .single();

  if (orderError || !order) {
    // Full Supabase error server-side only (code/details/hint) — never sent to the client.
    console.error('[OrderService] Order insert error:', {
      code:    orderError?.code,
      message: orderError?.message,
      details: orderError?.details,
      hint:    orderError?.hint,
    });
    throw new Error('Failed to create order record');
  }

  console.log(`[OrderService] Order created: ${order.id}`);

  // 9. Insert order_items records
  const orderItemsPayload = validatedItems.map(item => ({
    order_id:      order.id,
    product_id:    item.product_id,
    product_name:  item.product_name,
    product_price: item.product_price,
    quantity:      item.quantity,
    subtotal:      item.subtotal,
  }));

  const { error: itemsError } = await supabaseAdmin
    .from('order_items')
    .insert(orderItemsPayload);

  if (itemsError) {
    console.error('[OrderService] Order items insert error:', itemsError);
    // Attempt rollback
    await supabaseAdmin.from('orders').delete().eq('id', order.id);
    throw new Error('Failed to create order items');
  }

  console.log(`[OrderService] ${validatedItems.length} order items created`);

  // 10. Insert payment record
  // payments.transaction_id is NOT NULL — COD has no real transaction ID, so use a placeholder.
  const paymentPayload = {
    order_id:         order.id,
    customer_id:      customerId,
    payment_provider: isCOD ? 'cod' : 'cashfree',
    transaction_id:   transactionId || `COD-${order.id}`,
    amount:           totalAmount,
    currency:         CURRENCY,
    payment_status:   paymentStatus,
    payment_method:   paymentMethod,
    paid_at:          isCOD ? null : new Date().toISOString(),
  };

  const { error: paymentError } = await supabaseAdmin
    .from('payments')
    .insert(paymentPayload);

  if (paymentError) {
    console.error('[OrderService] Payment insert error:', paymentError);
    // Attempt rollback
    await supabaseAdmin.from('order_items').delete().eq('order_id', order.id);
    await supabaseAdmin.from('orders').delete().eq('id', order.id);
    throw new Error('Failed to create payment record');
  }

  console.log(`[OrderService] Payment record created for order: ${order.id}`);

  // 11. Confirm inventory reservation using the existing Supabase RPC
  if (sessionId) {
    const { error: reserveConfirmError } = await supabaseAdmin.rpc('confirm_checkout_reservations', {
      p_session_id: sessionId,
      p_order_id:   order.id,
    });

    if (reserveConfirmError) {
      console.error('[OrderService] Inventory confirmation error:', reserveConfirmError);
      // Don't fail the order for this — the reservation expiry system will handle cleanup
    } else {
      console.log(`[OrderService] Inventory reservation confirmed for session: ${sessionId}`);
    }
  }

  // 12. Record coupon usage + increment its used_count.
  // Never let bookkeeping failures fail an order that was already created —
  // supabase-js query builders are thenable but do NOT implement .catch(),
  // so this must be awaited inside a real try/catch (not chained .catch()).
  if (coupon) {
    try {
      const { error: usageError } = await supabaseAdmin
        .from('coupon_usage')
        .insert({
          coupon_id:       coupon.id,
          customer_id:     customerId,
          order_id:        order.id,
          discount_amount: discountAmount,
        });
      if (usageError) {
        console.error('[OrderService] Coupon usage insert error:', usageError);
      }

      const { error: incrementError } = await supabaseAdmin
        .from('coupons')
        .update({ used_count: (coupon.used_count || 0) + 1 })
        .eq('id', coupon.id);
      if (incrementError) {
        console.error('[OrderService] Coupon used_count increment error:', incrementError);
      }
    } catch (err) {
      console.error('[OrderService] Coupon usage bookkeeping failed:', err);
    }
  }

  return order;
}

/**
 * Preview a coupon's discount for a given subtotal WITHOUT creating an order.
 * Used by the cart/checkout "Apply Coupon" UI so customers see the discount
 * (and rejection reasons) before placing the order. Runs the exact same
 * validation + calculation logic as real order creation.
 */
export async function previewCoupon(couponCode, subtotal, customerId) {
  const coupon = await validateCoupon(couponCode, subtotal, customerId);
  const { discountAmount } = calculateTotals([{ subtotal }], coupon, 'standard', 'card');

  return {
    code:          coupon.code,
    discountType:  coupon.discount_type,
    discountValue: coupon.discount_value,
    discountAmount,
  };
}

/**
 * Reconcile a payment/order record from a verified Cashfree webhook event.
 *
 * IMPORTANT: this only ever UPDATES an existing payments/orders row that was
 * already created by the primary placeOrder flow — it never creates a new
 * order. A webhook payload has no cart/address/customer context to create an
 * order with, and the primary flow already verifies payment status directly
 * against the Cashfree API before creating the order in the first place.
 *
 * Idempotent: repeated/duplicate webhook deliveries for the same terminal
 * status are safely ignored, and a stale "pending" event can never downgrade
 * an already-paid or already-refunded record.
 *
 * @param {object} params
 * @param {string} params.transactionId    Cashfree cf_payment_id (matches payments.transaction_id)
 * @param {string} params.newPaymentStatus One of PAYMENT_STATUS values
 */
export async function syncPaymentFromCashfreeWebhook({ transactionId, newPaymentStatus }) {
  if (!supabaseAdmin) return { updated: false, reason: 'db_not_configured' };
  if (!transactionId)  return { updated: false, reason: 'missing_transaction_id' };

  const { data: payment, error: fetchError } = await supabaseAdmin
    .from('payments')
    .select('id, order_id, payment_status')
    .eq('transaction_id', transactionId)
    .maybeSingle();

  if (fetchError) {
    console.error('[OrderService] Webhook payment lookup error:', fetchError);
    return { updated: false, reason: 'lookup_failed' };
  }
  if (!payment) {
    // Order not created yet (webhook arrived before the primary flow's
    // placeOrder call) — nothing to update. The primary flow will create
    // the order with the correct, already-verified status shortly.
    return { updated: false, reason: 'no_matching_payment' };
  }
  if (payment.payment_status === newPaymentStatus) {
    return { updated: false, reason: 'already_up_to_date' };
  }

  // Never let a stale/duplicate "pending" event downgrade a terminal status.
  const terminalStatuses = [PAYMENT_STATUS.PAID, PAYMENT_STATUS.REFUNDED];
  if (terminalStatuses.includes(payment.payment_status) && newPaymentStatus === PAYMENT_STATUS.PENDING) {
    return { updated: false, reason: 'ignored_stale_pending' };
  }

  const paymentUpdates = { payment_status: newPaymentStatus };
  if (newPaymentStatus === PAYMENT_STATUS.PAID) paymentUpdates.paid_at = new Date().toISOString();

  const { error: paymentUpdateError } = await supabaseAdmin
    .from('payments')
    .update(paymentUpdates)
    .eq('id', payment.id);

  if (paymentUpdateError) {
    console.error('[OrderService] Webhook payment update error:', paymentUpdateError);
    return { updated: false, reason: 'payment_update_failed' };
  }

  const { error: orderUpdateError } = await supabaseAdmin
    .from('orders')
    .update({ payment_status: newPaymentStatus })
    .eq('id', payment.order_id);

  if (orderUpdateError) {
    console.error('[OrderService] Webhook order update error:', orderUpdateError);
    return { updated: false, reason: 'order_update_failed' };
  }

  return { updated: true, orderId: payment.order_id, paymentStatus: newPaymentStatus };
}

/**
 * Fetch orders for a specific customer (enforced by service-role query with customer_id filter).
 * Even with the service-role key, we always filter by customer_id to enforce data isolation.
 */
export async function getCustomerOrders(customerId) {
  if (!supabaseAdmin) throw new Error('Database not configured');

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select(`
      id,
      order_status,
      payment_status,
      subtotal,
      discount_amount,
      shipping_amount,
      tax_amount,
      total_amount,
      shipping_address,
      notes,
      created_at,
      order_items (
        id,
        product_id,
        product_name,
        product_price,
        quantity,
        subtotal,
        product:products!product_id (
          image_url
        )
      ),
      payments (
        payment_method,
        payment_status,
        transaction_id,
        paid_at
      )
    `)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[OrderService] Get customer orders error:', error);
    throw new Error('Failed to fetch orders');
  }

  return data || [];
}

/**
 * Fetch a single order for a specific customer.
 * Enforces ownership — customer cannot fetch another customer's order.
 */
export async function getCustomerOrderById(orderId, customerId) {
  if (!supabaseAdmin) throw new Error('Database not configured');

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select(`
      id,
      order_status,
      payment_status,
      subtotal,
      discount_amount,
      shipping_amount,
      tax_amount,
      total_amount,
      shipping_address,
      notes,
      created_at,
      updated_at,
      order_items (
        id,
        product_id,
        product_name,
        product_price,
        quantity,
        subtotal
      ),
      payments (
        payment_method,
        payment_status,
        transaction_id,
        payment_provider,
        paid_at
      )
    `)
    .eq('id', orderId)
    .eq('customer_id', customerId)   // ← security: enforce ownership
    .single();

  if (error || !data) {
    throw new Error('Order not found');
  }

  return data;
}

/**
 * Admin: fetch all orders with customer info and payment details.
 */
export async function getAllOrders({ page = 1, pageSize = 10, search = '', status = '', dateRange = '' } = {}) {
  if (!supabaseAdmin) throw new Error('Database not configured');

  let query = supabaseAdmin
    .from('orders')
    .select(`
      id,
      order_status,
      payment_status,
      total_amount,
      created_at,
      shipping_address,
      customer:Profiles!customer_id (
        id,
        full_name,
        email,
        phone
      ),
      order_items (
        id,
        product_id,
        product_name,
        product_price,
        quantity,
        subtotal
      ),
      payment:payments!order_id (
        payment_method,
        payment_status,
        transaction_id
      )
    `, { count: 'exact' });

  if (status) {
    query = query.eq('order_status', status);
  }

  if (dateRange) {
    const days = parseInt(dateRange);
    if (!isNaN(days)) {
      const from = new Date();
      from.setDate(from.getDate() - days);
      query = query.gte('created_at', from.toISOString());
    }
  }

  if (search) {
    // Search on customer name/email via a text filter is complex with joins.
    // We'll do a post-filter for search for now (acceptable for admin use case).
  }

  const from = (page - 1) * pageSize;
  const to   = from + pageSize - 1;

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error('[OrderService] Get all orders error:', error);
    throw new Error('Failed to fetch orders');
  }

  // Map to the shape expected by the admin UI
  let orders = (data || []).map(o => ({
    id:       o.id,
    orderId:  `#ORD-${o.id.slice(0, 8).toUpperCase()}`,
    date:     new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    createdAt: o.created_at, // raw ISO timestamp — dashboard needs this for "Today, 10:24 AM" formatting
    status:   o.order_status,
    amount:   o.total_amount,
    subtotal: o.total_amount, // we'll show total as subtotal for the UI
    discount: 0,
    customer: {
      id:       o.customer?.id || '',
      fullName: o.customer?.full_name || 'Unknown Customer',
      email:    o.customer?.email || '',
      phone:    o.customer?.phone || '',
    },
    payment: {
      method:  o.payment?.[0]?.payment_method || 'unknown',
      status:  o.payment?.[0]?.payment_status || 'unknown',
    },
    items: (o.order_items || []).map(i => ({
      id:          i.id,
      productId:   i.product_id,
      productName: i.product_name,
      quantity:    i.quantity,
      unitPrice:   i.product_price,
      subtotal:    i.subtotal,
    })),
  }));

  // Client-side search filter (name/email)
  if (search) {
    const q = search.toLowerCase();
    orders = orders.filter(
      o =>
        o.orderId.toLowerCase().includes(q) ||
        o.customer.fullName.toLowerCase().includes(q) ||
        (o.customer.phone && o.customer.phone.includes(q))
    );
  }

  return { orders, total: count || 0, page, pageSize };
}

/**
 * Admin: fetch a single order with full details.
 */
export async function getOrderDetailsAdmin(orderId) {
  if (!supabaseAdmin) throw new Error('Database not configured');

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select(`
      id,
      order_status,
      payment_status,
      subtotal,
      discount_amount,
      shipping_amount,
      tax_amount,
      total_amount,
      shipping_address,
      notes,
      created_at,
      coupon_id,
      customer:Profiles!customer_id (
        id,
        full_name,
        email,
        phone
      ),
      order_items (
        id,
        product_id,
        product_name,
        product_price,
        quantity,
        subtotal
      ),
      payment:payments!order_id (
        payment_method,
        payment_status,
        transaction_id,
        payment_provider,
        paid_at
      )
    `)
    .eq('id', orderId)
    .single();

  if (error || !data) {
    console.error('[OrderService] Get order details error:', error);
    throw new Error('Order not found');
  }

  let coupon = null;
  if (data.coupon_id) {
    const { data: couponData, error: couponError } = await supabaseAdmin
      .from('coupons')
      .select('id, code, discount_type, discount_value')
      .eq('id', data.coupon_id)
      .maybeSingle();

    if (couponError) {
      console.error('[OrderService] Get order coupon error:', couponError);
      throw new Error('Failed to fetch order coupon');
    }
    coupon = couponData;
  }

  // Map to the shape expected by admin UI OrderDetailDrawer
  return {
    id:        data.id,
    orderId:   `#ORD-${data.id.slice(0, 8).toUpperCase()}`,
    date:      new Date(data.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    createdAt: data.created_at,
    status:    data.order_status,
    amount:    data.total_amount,
    subtotal:  data.subtotal,
    discount:  data.discount_amount,
    shipping:  data.shipping_amount,
    tax:       data.tax_amount,
    customer: {
      id:       data.customer?.id || '',
      fullName: data.customer?.full_name || 'Unknown Customer',
      email:    data.customer?.email || '',
      phone:    data.customer?.phone || '',
    },
    payment: {
      method: data.payment?.[0]?.payment_method || '',
      status: data.payment?.[0]?.payment_status || '',
      provider: data.payment?.[0]?.payment_provider || '',
      transactionId: data.payment?.[0]?.transaction_id || '',
      paidAt: data.payment?.[0]?.paid_at || null,
    },
    coupon: coupon ? {
      code:          coupon.code,
      discountType:  coupon.discount_type,
      discountValue: coupon.discount_value,
    } : null,
    items: (data.order_items || []).map(i => ({
      id:          i.id,
      productId:   i.product_id,
      productName: i.product_name,
      quantity:    i.quantity,
      unitPrice:   i.product_price,
      subtotal:    i.subtotal,
      imageUrl:    i.product?.image_url || '',
    })),
    shippingAddress: data.shipping_address,
    notes:     data.notes,
  };
}

/**
 * Admin: update an order's lifecycle status.
 */
export async function updateOrderStatusAdmin(orderId, newStatus) {
  if (!supabaseAdmin) throw new Error('Database not configured');
  if (!Object.values(ORDER_STATUS).includes(newStatus)) {
    throw new Error('Invalid order status');
  }

  const { data, error } = await supabaseAdmin
    .from('orders')
    .update({ order_status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .select('id, order_status, updated_at')
    .maybeSingle();

  if (error) {
    console.error('[OrderService] Update order status error:', error);
    throw new Error('Failed to update order status');
  }
  if (!data) throw new Error('Order not found');

  return data;
}

/**
 * Admin: compute order statistics.
 */
export async function getOrderStats() {
  if (!supabaseAdmin) throw new Error('Database not configured');

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('order_status, created_at');

  if (error) {
    console.error('[OrderService] Stats error:', error);
    // Return zeros rather than crashing
    return { pending: 0, pendingTrend: '', shipped: 0, shippedTrend: '', delivered: 0, deliveredTrend: '', cancelled: 0, cancelledTrend: '' };
  }

  const counts = { pending: 0, confirmed: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
  for (const row of (data || [])) {
    if (counts[row.order_status] !== undefined) counts[row.order_status]++;
  }

  return {
    pending:        counts.pending + counts.confirmed + counts.processing,
    pendingTrend:   '',
    shipped:        counts.shipped,
    shippedTrend:   '',
    delivered:      counts.delivered,
    deliveredTrend: `${data.length > 0 ? Math.round((counts.delivered / data.length) * 100) : 0}% success rate`,
    cancelled:      counts.cancelled,
    cancelledTrend: `${data.length > 0 ? Math.round((counts.cancelled / data.length) * 100).toFixed(1) : 0}% rate`,
  };
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
// Business rule shared by every dashboard sales/order figure below:
// a 'cancelled' order never counts as a sale or a valid order for trend
// purposes. total_amount is already the final, tax/shipping/discount-inclusive
// order total (see DATABASE_SCHEMA.md) — it is used as-is, never recomputed.
//
// "This Week" is always Monday 00:00 → Sunday 23:59:59 in India Standard
// Time (UTC+5:30, no DST). The app has no other timezone utility/config, and
// IST is the only timezone implied by the existing ₹/en-IN formatting used
// throughout the admin app, so it is used consistently here to avoid the
// week boundary shifting with the server's OS timezone.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function getISTWeekBoundaries(referenceDate = new Date()) {
  const istNow = new Date(referenceDate.getTime() + IST_OFFSET_MS);
  const istDay = istNow.getUTCDay(); // 0=Sun..6=Sat, in shifted "UTC" == IST wall clock
  const daysSinceMonday = (istDay + 6) % 7; // Mon=0..Sun=6
  const istMonday = new Date(Date.UTC(
    istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate() - daysSinceMonday
  ));
  const thisWeekStart = new Date(istMonday.getTime() - IST_OFFSET_MS); // real UTC instant
  const thisWeekEnd   = new Date(thisWeekStart.getTime() + 7 * DAY_MS);
  const lastWeekStart = new Date(thisWeekStart.getTime() - 7 * DAY_MS);
  return { thisWeekStart, thisWeekEnd, lastWeekStart };
}

function isBetween(iso, start, end) {
  const t = new Date(iso).getTime();
  return t >= start.getTime() && t < end.getTime();
}

/**
 * Admin dashboard: Total Sales / Total Orders KPI cards + week-over-week trend.
 *
 *  - totalOrders = every order row (matches the Orders page's unfiltered total).
 *  - totalSales  = sum(total_amount) over all NON-cancelled orders.
 *  - trends compare this IST week (Mon 00:00 → now) against the prior 7 days.
 */
export async function getDashboardOverviewStats() {
  if (!supabaseAdmin) throw new Error('Database not configured');

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('order_status, total_amount, created_at');

  if (error) {
    console.error('[OrderService] Dashboard overview error:', error);
    throw new Error('Failed to fetch dashboard statistics');
  }

  const rows = data || [];
  const validRows = rows.filter(r => r.order_status !== ORDER_STATUS.CANCELLED);

  const totalOrders = rows.length;
  const totalSales  = validRows.reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0);

  const { thisWeekStart, thisWeekEnd, lastWeekStart } = getISTWeekBoundaries();

  const thisWeekValid = validRows.filter(r => isBetween(r.created_at, thisWeekStart, thisWeekEnd));
  const lastWeekValid = validRows.filter(r => isBetween(r.created_at, lastWeekStart, thisWeekStart));
  const thisWeekAll   = rows.filter(r => isBetween(r.created_at, thisWeekStart, thisWeekEnd));
  const lastWeekAll   = rows.filter(r => isBetween(r.created_at, lastWeekStart, thisWeekStart));

  const thisWeekSales = thisWeekValid.reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0);
  const lastWeekSales = lastWeekValid.reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0);

  const salesTrend  = computeTrend(thisWeekSales, lastWeekSales);
  const ordersTrend = computeTrend(thisWeekAll.length, lastWeekAll.length);

  return {
    totalSales,
    totalOrders,
    salesTrendPercent:   salesTrend.percent,
    salesTrendDirection: salesTrend.direction,
    ordersTrendPercent:   ordersTrend.percent,
    ordersTrendDirection: ordersTrend.direction,
  };
}

/**
 * Admin dashboard: Weekly Sales Overview chart data.
 * Returns 7 buckets labeled Mon → Sun (same fixed axis order as before),
 * each representing that weekday's most recent occurrence within the
 * trailing 7 IST days (today included) — NOT the strict Mon-Sun calendar
 * week. Using the calendar week caused a real order placed a few days ago
 * (e.g. last Sunday, before this week's Monday cutoff) to be silently
 * excluded from every bucket, showing an all-zero graph despite real
 * sales existing. Cancelled orders are still excluded from both lines.
 */
export async function getWeeklySalesData() {
  if (!supabaseAdmin) throw new Error('Database not configured');

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('order_status, total_amount, created_at');

  if (error) {
    console.error('[OrderService] Weekly sales error:', error);
    throw new Error('Failed to fetch weekly sales data');
  }

  const validRows = (data || []).filter(r => r.order_status !== ORDER_STATUS.CANCELLED);

  const nowIST    = new Date(Date.now() + IST_OFFSET_MS);
  const todayIST  = new Date(Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth(), nowIST.getUTCDate()));
  const todayIdx  = (nowIST.getUTCDay() + 6) % 7; // Mon=0..Sun=6

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const buckets = dayLabels.map((day, w) => {
    const daysAgo    = (todayIdx - w + 7) % 7;
    const dateIST    = new Date(todayIST.getTime() - daysAgo * DAY_MS);
    const start      = new Date(dateIST.getTime() - IST_OFFSET_MS); // real UTC instant
    const end        = new Date(start.getTime() + DAY_MS);
    return { day, sales: 0, orders: 0, start, end };
  });

  for (const row of validRows) {
    const bucket = buckets.find(b => isBetween(row.created_at, b.start, b.end));
    if (bucket) {
      bucket.sales  += Number(row.total_amount) || 0;
      bucket.orders += 1;
    }
  }

  return buckets.map(({ day, sales, orders }) => ({ day, sales, orders }));
}

/**
 * Admin dashboard: Top Selling Items — actual quantity sold per product,
 * aggregated from order_items across all-time NON-cancelled orders (no
 * separate "top selling period" exists elsewhere in the app to reuse).
 */
export async function getTopSellingProductsData(limit = 5) {
  if (!supabaseAdmin) throw new Error('Database not configured');

  const { data, error } = await supabaseAdmin
    .from('order_items')
    .select('product_id, quantity, orders!inner(order_status)');

  if (error) {
    console.error('[OrderService] Top selling products error:', error);
    throw new Error('Failed to fetch top selling products');
  }

  const soldByProduct = {};
  for (const item of data || []) {
    if (!item.product_id) continue;
    if (item.orders?.order_status === ORDER_STATUS.CANCELLED) continue;
    soldByProduct[item.product_id] = (soldByProduct[item.product_id] || 0) + (Number(item.quantity) || 0);
  }

  const topIds = Object.entries(soldByProduct)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  if (topIds.length === 0) return [];

  const { data: products, error: productsError } = await supabaseAdmin
    .from('products')
    .select('id, name, price, image_url')
    .in('id', topIds);

  if (productsError) {
    console.error('[OrderService] Top selling product details error:', productsError);
    throw new Error('Failed to fetch top selling product details');
  }

  const productMap = Object.fromEntries((products || []).map(p => [p.id, p]));

  return topIds.map(id => ({
    id,
    name:  productMap[id]?.name ?? 'Unknown product',
    price: productMap[id]?.price ?? 0,
    image: productMap[id]?.image_url || null,
    sold:  soldByProduct[id],
  }));
}

