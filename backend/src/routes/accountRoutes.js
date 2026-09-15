/**
 * ANNAPURNA Backend — Account Routes
 *
 * Customer routes:
 *   DELETE /api/account          — Delete my own account (JWT-verified)
 *   PATCH  /api/account/profile  — Sync name/phone/avatar to Profiles row
 */

import { Router } from 'express';
import { deleteMyAccount, updateMyProfileRow } from '../controllers/accountController.js';

export const accountRouter = Router();

accountRouter.delete('/', deleteMyAccount);
accountRouter.patch('/profile', updateMyProfileRow);

