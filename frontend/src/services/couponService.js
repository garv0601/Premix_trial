/**
 * ANNPURNA — Coupon Service (Frontend)
 *
 * Validates a coupon code against the backend (which enforces all rules
 * server-side: active/expired, minimum order, usage limits, per-customer
 * usage). No coupon business logic lives in the frontend.
 */

import supabase from '../lib/supabase';
import { BASE_URL as API_BASE } from './api';

async function getAuthToken() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}

/**
 * Validate a coupon code for the given cart subtotal.
 * @param {string} code
 * @param {number} subtotal
 * @returns {Promise<{code:string, discountType:string, discountValue:number, discountAmount:number}>}
 */
export async function validateCoupon(code, subtotal) {
  const token = await getAuthToken();
  if (!token) throw new Error('Please sign in to apply a coupon.');

  const res = await fetch(`${API_BASE}/coupons/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ code, subtotal }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Invalid coupon code');
  }

  return {
    code: data.code,
    discountType: data.discountType,
    discountValue: data.discountValue,
    discountAmount: data.discountAmount,
  };
}
