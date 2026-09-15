/**
 * ANNAPURNA Backend — Admin Customer Routes
 *
 * All routes require an authenticated, active admin (requireAdmin).
 *
 *   GET   /api/admin/customers        — list customers + order aggregates
 *   GET   /api/admin/customers/stats  — KPI statistics
 *   GET    /api/admin/customers/:id    — single customer's full profile
 *   PATCH  /api/admin/customers/:id    — update a customer's profile fields
 *   DELETE /api/admin/customers/:id    — permanently delete a customer
 */

import { Router } from 'express';
import {
  listCustomers,
  getCustomerStats,
  getCustomerById,
  updateCustomerById,
  deleteCustomerById,
} from '../controllers/customerController.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

export const adminCustomerRouter = Router();

adminCustomerRouter.use(requireAdmin);
adminCustomerRouter.get('/stats', getCustomerStats);
adminCustomerRouter.get('/:id', getCustomerById);
adminCustomerRouter.patch('/:id', updateCustomerById);
adminCustomerRouter.delete('/:id', deleteCustomerById);
adminCustomerRouter.get('/', listCustomers);
