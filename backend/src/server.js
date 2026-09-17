// Must be the first import — populates process.env before any other module
// (config/cashfree.js, config/supabase.js, config/config.js) reads it at import time.
import './config/env.js';

import express from 'express';
import cors from 'cors';
import { config } from './config/config.js';
import { logger } from './middleware/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import productRoutes from './routes/productRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import { orderRouter, adminOrderRouter } from './routes/orderRoutes.js';
import { accountRouter } from './routes/accountRoutes.js';
import { couponRouter } from './routes/couponRoutes.js';
import { adminCustomerRouter } from './routes/customerRoutes.js';

const app = express();

// Middlewares
app.use(cors({ origin: config.corsOrigin }));
// Capture the exact raw request body alongside the parsed JSON body — the
// Cashfree webhook signature is computed over the raw (unparsed) payload,
// so req.rawBody is needed purely for that verification step.
app.use(express.json({
  verify: (req, _res, buf) => { req.rawBody = buf.toString('utf8'); },
}));
app.use(logger);

// Routes
app.use(`${config.apiPrefix}/products`,      productRoutes);
app.use(`${config.apiPrefix}/reviews`,       reviewRoutes);
app.use(`${config.apiPrefix}/contact`,       contactRoutes);
app.use(`${config.apiPrefix}/orders`,        orderRouter);
app.use(`${config.apiPrefix}/admin/orders`,  adminOrderRouter);
app.use(`${config.apiPrefix}/account`,       accountRouter);
app.use(`${config.apiPrefix}/coupons`,       couponRouter);
app.use(`${config.apiPrefix}/admin/customers`, adminCustomerRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', environment: config.env, timestamp: new Date().toISOString() });
});

// Global Error Handler
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  console.log(`🚀 ANNAPURNA API Server running on port ${config.port} [${config.env}]`);
  console.log(`📡 Health Check:  http://localhost:${config.port}/health`);
  console.log(`🛍️ Products:      http://localhost:${config.port}${config.apiPrefix}/products`);
  console.log(`📦 Orders:        http://localhost:${config.port}${config.apiPrefix}/orders`);
  console.log(`🔐 Admin Orders:  http://localhost:${config.port}${config.apiPrefix}/admin/orders`);
});
