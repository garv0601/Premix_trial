/**
 * ANNAPURNA Backend — Coupon Controller
 *
 * Lets the customer frontend preview/validate a coupon code (and its
 * discount) before placing an order. Uses the same server-side validation
 * logic as real order creation (services/orderService.js) — no duplicated
 * business rules.
 */

import { verifyUser } from '../config/supabase.js';
import { previewCoupon } from '../services/orderService.js';

function extractBearerToken(req) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    return auth.slice(7);
  }
  return null;
}

/**
 * POST /api/coupons/validate
 * Body: { code: string, subtotal: number }
 * Requires authentication (per-customer usage limits are enforced).
 */
export async function validateCouponCode(req, res) {
  try {
    const token = extractBearerToken(req);
    if (!token) return res.status(401).json({ success: false, message: 'Unauthorised' });

    const user = await verifyUser(token);

    const { code, subtotal } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }
    if (typeof subtotal !== 'number' || subtotal <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid cart subtotal' });
    }

    const result = await previewCoupon(code, subtotal, user.id);
    res.json({ success: true, ...result });
  } catch (err) {
    // Validation failures are expected/user-facing (invalid, expired, already used, etc.)
    res.status(400).json({ success: false, message: err.message || 'Invalid coupon code' });
  }
}
