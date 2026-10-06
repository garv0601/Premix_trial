import express from 'express';
import { getReviews, createReview } from '../controllers/reviewController.js';
import { createRateLimiter } from '../middleware/security.js';

const router = express.Router();

// Limit review submissions to curb spam on the public endpoint.
const reviewLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10,
  message: 'Too many reviews submitted. Please try again later.',
});

router.get('/product/:productId', getReviews);
router.post('/', reviewLimiter, createReview);

export default router;
