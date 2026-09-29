/**
 * COUPON SERVICE — Real Supabase Integration
 *
 * Connects the Admin Coupons page to the actual `public.coupons` table.
 *
 * IMPORTANT — real column names (see admin/DATABASE_SCHEMA.md §8):
 *   minimum_order_amount, maximum_discount, used_count, starts_at,
 *   expires_at, is_active (boolean). There is NO "status" column —
 *   status (active/inactive/expired/scheduled) is derived client-side
 *   from is_active + starts_at + expires_at.
 *
 * RLS: reads/writes require an authenticated admin (is_admin() policy).
 */

import { supabase } from '../lib/supabase';

/* ══════════════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════════════ */

function computeStatus(row) {
  if (!row.is_active) return 'inactive';
  const now = new Date();
  if (row.expires_at && new Date(row.expires_at) < now) return 'expired';
  if (row.starts_at && new Date(row.starts_at) > now) return 'scheduled';
  return 'active';
}

function enrichCoupon(row) {
  return {
    ...row,
    used_count: row.used_count ?? 0,
    minimum_order_amount: row.minimum_order_amount ?? 0,
    // Defaults to true when the column is absent (pre-migration) so the toggle
    // reads as "shown" until an admin explicitly hides the coupon.
    show_as_offer: row.show_as_offer !== false,
    status: computeStatus(row),
  };
}

function toDbPayload(formData) {
  return {
    code: formData.code.trim().toUpperCase(),
    discount_type: formData.discount_type,
    discount_value: Number(formData.discount_value),
    minimum_order_amount: formData.minimum_order_amount ? Number(formData.minimum_order_amount) : 0,
    maximum_discount: formData.maximum_discount ? Number(formData.maximum_discount) : null,
    usage_limit: formData.usage_limit ? Number(formData.usage_limit) : null,
    starts_at: formData.starts_at || null,
    expires_at: formData.expires_at || null,
    is_active: formData.is_active !== undefined ? !!formData.is_active : true,
    show_as_offer: formData.show_as_offer !== undefined ? !!formData.show_as_offer : true,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Postgres reports an unknown column with SQLSTATE 42703. Until the
 * `show_as_offer` migration has been applied, writes that include that column
 * would fail — so we transparently retry once without it. This keeps the Admin
 * Coupons page fully functional before and after the migration.
 */
function isUndefinedColumnError(error, column) {
  return !!error && (error.code === '42703' || (error.message || '').includes(column));
}

/* ══════════════════════════════════════════════════════════════
   FETCH
   ══════════════════════════════════════════════════════════════ */

export async function getCoupons() {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[couponService] getCoupons error:', error);
    throw new Error('Failed to fetch coupons');
  }
  return (data || []).map(enrichCoupon);
}

export async function getCouponStats() {
  const coupons = await getCoupons();
  const activeCount = coupons.filter((c) => c.status === 'active').length;
  const expiringSoon = coupons.filter((c) => {
    if (c.status !== 'active' || !c.expires_at) return false;
    const daysLeft = (new Date(c.expires_at) - new Date()) / 86400000;
    return daysLeft <= 7;
  }).length;
  const totalUsage = coupons.reduce((sum, c) => sum + (c.used_count || 0), 0);

  return {
    total_coupons: coupons.length,
    active_coupons: activeCount,
    expiring_soon: expiringSoon,
    total_usage: totalUsage,
  };
}

/* ══════════════════════════════════════════════════════════════
   WRITE
   ══════════════════════════════════════════════════════════════ */

export async function createCoupon(formData) {
  const payload = toDbPayload(formData);
  let { data, error } = await supabase
    .from('coupons')
    .insert(payload)
    .select('*')
    .single();

  // Retry without show_as_offer if the migration hasn't been applied yet.
  if (error && isUndefinedColumnError(error, 'show_as_offer')) {
    const { show_as_offer, ...legacyPayload } = payload;
    ({ data, error } = await supabase
      .from('coupons')
      .insert(legacyPayload)
      .select('*')
      .single());
  }

  if (error) {
    console.error('[couponService] createCoupon error:', error);
    if (error.code === '23505') throw new Error('A coupon with this code already exists');
    throw new Error(error.message || 'Failed to create coupon');
  }
  return enrichCoupon(data);
}

export async function updateCoupon(id, formData) {
  const payload = toDbPayload(formData);
  let { data, error } = await supabase
    .from('coupons')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  // Retry without show_as_offer if the migration hasn't been applied yet.
  if (error && isUndefinedColumnError(error, 'show_as_offer')) {
    const { show_as_offer, ...legacyPayload } = payload;
    ({ data, error } = await supabase
      .from('coupons')
      .update(legacyPayload)
      .eq('id', id)
      .select('*')
      .single());
  }

  if (error) {
    console.error('[couponService] updateCoupon error:', error);
    if (error.code === '23505') throw new Error('A coupon with this code already exists');
    throw new Error(error.message || 'Failed to update coupon');
  }
  return enrichCoupon(data);
}

/**
 * "Delete" = deactivate (is_active = false).
 * coupons.id is referenced by orders.coupon_id and coupon_usage.coupon_id,
 * so hard-deleting would break historical order records. Deactivating
 * preserves order history while immediately stopping further use.
 */
export async function deleteCoupon(id) {
  const { error } = await supabase
    .from('coupons')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('[couponService] deleteCoupon error:', error);
    throw new Error(error.message || 'Failed to delete coupon');
  }
}
