/**
 * ANNAPURNA Backend — Razorpay Client
 *
 * Initialises the Razorpay SDK with the secret key.
 * The secret key MUST stay server-side only.
 */

import Razorpay from 'razorpay';
import crypto from 'crypto';

const keyId     = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  console.warn(
    '[Razorpay] RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not set.\n' +
    'Online payment verification will fail until these are configured in the backend .env'
  );
}

export const razorpayClient = keyId && keySecret
  ? new Razorpay({ key_id: keyId, key_secret: keySecret })
  : null;

/**
 * Verify a Razorpay payment signature server-side.
 *
 * @param {string} orderId        Razorpay Order ID (razorpay_order_id)
 * @param {string} paymentId      Razorpay Payment ID (razorpay_payment_id)
 * @param {string} signature      Razorpay Signature from the frontend callback
 * @returns {boolean}             true if signature is valid
 */
export function verifyRazorpaySignature(orderId, paymentId, signature) {
  if (!keySecret) return false;
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return expectedSignature === signature;
}
