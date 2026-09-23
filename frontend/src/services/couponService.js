/**
 * ANNAPURNA — Coupon Service (Frontend)
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

/**
 * Fetch the list of active, currently-valid coupons to surface as
 * "Available offers" during checkout.
 *
 * Reads directly from the same `public.coupons` table the backend validates
 * against — it never invents or hardcodes offers. Row-Level Security decides
 * what a signed-in customer may see; if nothing is readable (or the query
 * fails) this resolves to an empty list so the UI simply hides the section.
 *
 * All real coupon rules (minimum order, usage limits, per-customer usage,
 * exact discount amount) are still enforced server-side on apply — this list
 * is purely a discovery aid.
 */
export async function getAvailableCoupons() {
  if (!supabase) return [];
  try {
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from('coupons')
      .select('code, description, discount_type, discount_value, minimum_order_amount, maximum_discount, starts_at, expires_at, is_active')
      .eq('is_active', true);

    if (error || !Array.isArray(data)) return [];

    return data.filter((c) => {
      const started = !c.starts_at || c.starts_at <= nowIso;
      const notExpired = !c.expires_at || c.expires_at >= nowIso;
      return started && notExpired;
    });
  } catch {
    return [];
  }
}
