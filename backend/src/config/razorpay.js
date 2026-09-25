/**
 * ANNAPURNA Backend — Razorpay Payment Gateway Client
 *
 * Talks to the Razorpay REST API directly (Node's built-in fetch — no extra
 * dependency needed). The Key ID / Key Secret MUST stay server-side only —
 * only the public Key ID is ever safe to send to the frontend.
 *
 * Docs: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/
 */

import crypto from 'crypto';

const keyId         = process.env.RAZORPAY_KEY_ID;
const keySecret     = process.env.RAZORPAY_KEY_SECRET;
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

const BASE_URL = 'https://api.razorpay.com/v1';

export const razorpayConfigured = Boolean(keyId && keySecret);

// The public Key ID is required by the frontend checkout SDK. It is NOT a
// secret, so exposing it to the browser (via the create-order response) is safe.
export const razorpayKeyId = keyId || null;

if (!razorpayConfigured) {
  console.warn(
    '[Razorpay] RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not set.\n' +
    'Online payment verification will fail until these are configured in the backend .env'
  );
}

function authHeader() {
  const token = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  return {
    'Content-Type':  'application/json',
    Accept:          'application/json',
    Authorization:   `Basic ${token}`,
  };
}

/**
 * POST /orders — create a Razorpay order and return the order object
 * (including its `id`) for the frontend checkout SDK to open.
 *
 * @param {object} params
 * @param {string} params.receipt          Unique merchant-side receipt id (idempotency key at Razorpay)
 * @param {number} params.amount           Order amount in MAJOR units (e.g. rupees) — converted to paise here
 * @param {string} [params.currency]       Defaults to INR
 * @param {object} [params.notes]          Optional key/value metadata stored on the Razorpay order
 */
export async function razorpayCreateOrder({ receipt, amount, currency = 'INR', notes }) {
  if (!razorpayConfigured) throw new Error('Razorpay is not configured');

  const body = {
    // Razorpay expects the amount in the smallest currency unit (paise for INR).
    amount:   Math.round(Number(amount) * 100),
    currency,
    receipt,
    // Auto-capture the payment as soon as it is authorised so the order
    // reaches the terminal `paid` status without a separate capture call.
    payment_capture: 1,
  };
  if (notes && typeof notes === 'object') {
    body.notes = notes;
  }

  const res  = await fetch(`${BASE_URL}/orders`, {
    method:  'POST',
    headers: authHeader(),
    body:    JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data?.error?.description || 'Razorpay order creation failed');
    err.razorpayResponse = data;
    throw err;
  }
  return data;
}

/**
 * GET /orders/{order_id} — fetch a Razorpay order's current status.
 * Never trust the frontend's checkout callback alone — always verify here.
 */
export async function razorpayFetchOrder(orderId) {
  if (!razorpayConfigured) throw new Error('Razorpay is not configured');

  const res  = await fetch(`${BASE_URL}/orders/${encodeURIComponent(orderId)}`, {
    method:  'GET',
    headers: authHeader(),
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data?.error?.description || 'Failed to fetch Razorpay order');
    err.razorpayResponse = data;
    throw err;
  }
  return data;
}

/**
 * GET /orders/{order_id}/payments — fetch every payment attempt made
 * against a Razorpay order, used to locate the successful (captured) payment.
 */
export async function razorpayFetchOrderPayments(orderId) {
  if (!razorpayConfigured) throw new Error('Razorpay is not configured');

  const res  = await fetch(`${BASE_URL}/orders/${encodeURIComponent(orderId)}/payments`, {
    method:  'GET',
    headers: authHeader(),
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data?.error?.description || 'Failed to fetch Razorpay order payments');
    err.razorpayResponse = data;
    throw err;
  }
  return Array.isArray(data?.items) ? data.items : [];
}

/**
 * Verify the payment signature returned by the frontend Checkout handler.
 *
 * signature := HMAC-SHA256(keySecret, `${razorpay_order_id}|${razorpay_payment_id}`)
 * A completed checkout callback is only trusted once this matches.
 *
 * @param {object} params
 * @param {string} params.orderId     razorpay_order_id from the checkout handler
 * @param {string} params.paymentId   razorpay_payment_id from the checkout handler
 * @param {string} params.signature   razorpay_signature from the checkout handler
 */
export function verifyRazorpayPaymentSignature({ orderId, paymentId, signature }) {
  if (!keySecret || !orderId || !paymentId || !signature) return false;

  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  try {
    const expectedBuf = Buffer.from(expected);
    const actualBuf   = Buffer.from(signature);
    if (expectedBuf.length !== actualBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  } catch {
    return false;
  }
}

/**
 * Verify a Razorpay webhook signature server-side.
 *
 * signature := HMAC-SHA256(webhookSecret, rawBody)  (hex)
 * Header:  x-razorpay-signature
 *
 * @param {string} signature   value of the `x-razorpay-signature` header
 * @param {string} rawBody     the exact raw request body string (not re-serialised JSON)
 */
export function verifyRazorpayWebhookSignature(signature, rawBody) {
  if (!webhookSecret || !signature || rawBody === undefined) return false;

  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  try {
    const expectedBuf = Buffer.from(expected);
    const actualBuf   = Buffer.from(signature);
    if (expectedBuf.length !== actualBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  } catch {
    return false;
  }
}
