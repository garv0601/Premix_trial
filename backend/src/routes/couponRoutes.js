/**
 * ANNAPURNA Backend — Coupon Routes
 *
 * POST /api/coupons/validate  — validate + preview a coupon's discount
 * GET  /api/coupons/available — list coupons offerable to the signed-in customer
 */

import { Router } from 'express';
import { validateCouponCode, getAvailableCoupons } from '../controllers/couponController.js';
import { createRateLimiter } from '../middleware/security.js';

export const couponRouter = Router();

// Prevent coupon-code brute forcing while staying generous for real shoppers.
const couponValidateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: 'Too many coupon attempts. Please slow down and try again shortly.',
});

couponRouter.post('/validate', couponValidateLimiter, validateCouponCode);
couponRouter.get('/available', getAvailableCoupons);
