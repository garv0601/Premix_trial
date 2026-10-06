import { Router } from 'express';
import { submitContact } from '../controllers/contact.controller.js';
import { createRateLimiter } from '../middleware/security.js';

const router = Router();

// Abuse protection — the contact form is public and unauthenticated.
const contactLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  message: 'Too many messages sent. Please try again in a few minutes.',
});

router.post('/', contactLimiter, submitContact);

export default router;
