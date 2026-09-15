/**
 * ANNAPURNA Backend — Coupon Routes
 *
 * POST /api/coupons/validate — validate + preview a coupon's discount
 */

import { Router } from 'express';
import { validateCouponCode } from '../controllers/couponController.js';

export const couponRouter = Router();

couponRouter.post('/validate', validateCouponCode);
