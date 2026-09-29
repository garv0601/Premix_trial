/**
 * ANNAPURNA Backend — Coupon Routes
 *
 * POST /api/coupons/validate  — validate + preview a coupon's discount
 * GET  /api/coupons/available — list coupons offerable to the signed-in customer
 */

import { Router } from 'express';
import { validateCouponCode, getAvailableCoupons } from '../controllers/couponController.js';

export const couponRouter = Router();

couponRouter.post('/validate', validateCouponCode);
couponRouter.get('/available', getAvailableCoupons);
