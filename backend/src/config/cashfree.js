/**
 * ANNAPURNA Backend — Cashfree Payment Gateway Client
 *
 * Talks to the Cashfree Payment Gateway REST API directly (Node's built-in
 * fetch — no extra dependency needed). The App ID / Secret Key MUST stay
 * server-side only — never expose them to the frontend.
 *
 * Docs: https://www.cashfree.com/docs/payments/online/web/redirect
 */

import crypto from 'crypto';

const appId     = process.env.CASHFREE_APP_ID;
const secretKey = process.env.CASHFREE_SECRET_KEY;

// 'SANDBOX' (test/dev, default) or 'PRODUCTION'. Keep TEST/SANDBOX mode
// clearly separated from production — only switch this once Cashfree is live.
const environment = (process.env.CASHFREE_ENV || 'SANDBOX').toUpperCase();
const apiVersion   = process.env.CASHFREE_API_VERSION || '2023-08-01';

const BASE_URL = environment === 'PRODUCTION'
  ? 'https://api.cashfree.com/pg'
  : 'https://sandbox.cashfree.com/pg';

export const cashfreeConfigured = Boolean(appId && secretKey);

if (!cashfreeConfigured) {
  console.warn(
    '[Cashfree] CASHFREE_APP_ID or CASHFREE_SECRET_KEY is not set.\n' +
    'Online payment verification will fail until these are configured in the backend .env'
  );
}

function authHeaders() {
  return {
    'Content-Type':    'application/json',
    Accept:            'application/json',
    'x-api-version':   apiVersion,
    'x-client-id':     appId,
    'x-client-secret': secretKey,
  };
}

/**
 * POST /orders — create a Cashfree order and return a payment_session_id
 * for the frontend checkout SDK to open.
 *
 * @param {object} params
 * @param {string} params.orderId          Unique merchant-side order id (idempotency key at Cashfree)
 * @param {number} params.amount           Order amount (major units, e.g. rupees)
 * @param {string} [params.currency]       Defaults to INR
 * @param {object} params.customer         { id, name, email, phone }
 * @param {string} [params.returnUrl]      Fallback redirect URL (used only when a modal/popup can't open)
 */
export async function cashfreeCreateOrder({ orderId, amount, currency = 'INR', customer, returnUrl }) {
  if (!cashfreeConfigured) throw new Error('Cashfree is not configured');

  const body = {
    order_id:       orderId,
    order_amount:   amount,
    order_currency: currency,
    customer_details: {
      customer_id:    customer.id,
      customer_name:  customer.name || undefined,
      customer_email: customer.email || undefined,
      customer_phone: customer.phone || '9999999999',
    },
  };
  if (returnUrl) {
    body.order_meta = { return_url: returnUrl };
  }

  const res  = await fetch(`${BASE_URL}/orders`, {
    method:  'POST',
    headers: authHeaders(),
    body:    JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data?.message || 'Cashfree order creation failed');
    err.cashfreeResponse = data;
    throw err;
  }
  return data;
}

/**
 * GET /orders/{order_id} — fetch a Cashfree order's current status.
 * Never trust the frontend's redirect/callback alone — always verify here.
 */
export async function cashfreeFetchOrder(orderId) {
  if (!cashfreeConfigured) throw new Error('Cashfree is not configured');

  const res  = await fetch(`${BASE_URL}/orders/${encodeURIComponent(orderId)}`, {
    method:  'GET',
    headers: authHeaders(),
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data?.message || 'Failed to fetch Cashfree order');
    err.cashfreeResponse = data;
    throw err;
  }
  return data;
}

/**
 * GET /orders/{order_id}/payments — fetch every payment attempt made
 * against a Cashfree order, used to locate the successful cf_payment_id.
 */
export async function cashfreeFetchOrderPayments(orderId) {
  if (!cashfreeConfigured) throw new Error('Cashfree is not configured');

  const res  = await fetch(`${BASE_URL}/orders/${encodeURIComponent(orderId)}/payments`, {
    method:  'GET',
    headers: authHeaders(),
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data?.message || 'Failed to fetch Cashfree order payments');
    err.cashfreeResponse = data;
    throw err;
  }
  return Array.isArray(data) ? data : [];
}

/**
 * Verify a Cashfree webhook signature server-side.
 *
 * signature := Base64Encode(HMAC-SHA256(secretKey, `${timestamp}${rawBody}`))
 * Headers:  x-webhook-signature, x-webhook-timestamp
 *
 * @param {string} signature   value of the `x-webhook-signature` header
 * @param {string} rawBody     the exact raw request body string (not re-serialised JSON)
 * @param {string} timestamp   value of the `x-webhook-timestamp` header
 */
export function verifyCashfreeWebhookSignature(signature, rawBody, timestamp) {
  if (!secretKey || !signature || !timestamp || rawBody === undefined) return false;

  const expected = crypto
    .createHmac('sha256', secretKey)
    .update(timestamp + rawBody)
    .digest('base64');

  try {
    const expectedBuf = Buffer.from(expected);
    const actualBuf   = Buffer.from(signature);
    if (expectedBuf.length !== actualBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  } catch {
    return false;
  }
}
