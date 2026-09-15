/**
 * ANNAPURNA Backend — Admin Customer Controller
 *
 * Uses the SERVICE-ROLE client (supabaseAdmin) so admin reads/writes on
 * `Profiles` are NOT blocked by the customer-privacy RLS policies that
 * intentionally lock the table down for anon/authenticated clients (see
 * DATABASE_SCHEMA.md). Access to these routes is gated by requireAdmin
 * (verifies the caller's JWT + an active admin_users row) before any of
 * these handlers run.
 */

import { supabaseAdmin } from '../config/supabase.js';
import { computeTrend } from '../utils/trend.js';

const PROFILE_LIST_COLUMNS =
  'id, full_name, email, phone, avatar_url, role, Status, created_at, Updated_at';

const PROFILE_FULL_COLUMNS =
  PROFILE_LIST_COLUMNS +
  ', date_of_birth, preferred_language, custom_language, dietary_preference, ' +
  'food_allergies, spice_preference, promotional_offers, new_product_notifications, ' +
  'email_notifications, sms_notifications, whatsapp_notifications';

// Only these Profiles columns can ever be changed by an admin from the
// Customers page — never avatar_url/email/role/password.
const ALLOWED_UPDATE_FIELDS = [
  'full_name',
  'phone',
  'date_of_birth',
  'preferred_language',
  'custom_language',
  'dietary_preference',
  'food_allergies',
  'spice_preference',
  'promotional_offers',
  'new_product_notifications',
  'email_notifications',
  'sms_notifications',
  'whatsapp_notifications',
  'Status',
];

function splitFullName(fullName) {
  if (!fullName) return { first_name: '', last_name: '' };
  const parts = fullName.trim().split(/\s+/);
  return { first_name: parts[0] || '', last_name: parts.slice(1).join(' ') || '' };
}

function enrichCustomer(profile, agg) {
  const { first_name, last_name } = splitFullName(profile.full_name);
  return {
    id: profile.id,
    full_name: profile.full_name || '',
    first_name,
    last_name,
    email: profile.email || '',
    phone: profile.phone || '',
    avatar_url: profile.avatar_url || null,
    role: profile.role || null,
    status: (profile.Status || 'active').toLowerCase(),
    created_at: profile.created_at,
    updated_at: profile.Updated_at,
    total_orders: agg?.total_orders ?? 0,
    total_spent: agg?.total_spent ?? 0,
    last_order_date: agg?.last_order_date ?? null,
  };
}

/**
 * Fetch order aggregates (count/total/last date) for a set of customer ids
 * in a single query — avoids N+1 lookups.
 */
async function fetchOrderAggregates(customerIds) {
  const orderMap = {};
  if (!customerIds.length) return orderMap;

  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select('customer_id, total_amount, created_at')
    .in('customer_id', customerIds);

  if (error) {
    console.error('[AdminCustomers] order aggregate fetch error:', error.message);
    return orderMap;
  }

  for (const order of orders || []) {
    if (!orderMap[order.customer_id]) {
      orderMap[order.customer_id] = { total_orders: 0, total_spent: 0, last_order_date: null };
    }
    const agg = orderMap[order.customer_id];
    agg.total_orders += 1;
    agg.total_spent += Number(order.total_amount) || 0;
    if (!agg.last_order_date || order.created_at > agg.last_order_date) {
      agg.last_order_date = order.created_at;
    }
  }
  return orderMap;
}

/**
 * GET /api/admin/customers
 * All non-admin customer profiles enriched with order aggregates.
 */
export async function listCustomers(req, res, next) {
  try {
    const { data: profiles, error } = await supabaseAdmin
      .from('Profiles')
      .select(PROFILE_LIST_COLUMNS)
      .or('role.neq.admin,role.is.null')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const ids = (profiles || []).map((p) => p.id);
    const orderMap = await fetchOrderAggregates(ids);
    const customers = (profiles || []).map((p) => enrichCustomer(p, orderMap[p.id]));

    res.json({ success: true, customers });
  } catch (err) {
    console.error('[AdminCustomers] listCustomers error:', err.message);
    next(err);
  }
}

/**
 * GET /api/admin/customers/stats
 *   - total_customers   → every live non-admin profile + archived deleted rows
 *   - new_customers     → created in the last 7 days
 *   - active_customers  → Status = 'active'
 *   - repeat_customers  → 2 or more orders
 */
export async function getCustomerStats(req, res, next) {
  try {
    const { data: profiles, error } = await supabaseAdmin
      .from('Profiles')
      .select('id, Status, created_at, role')
      .or('role.neq.admin,role.is.null');

    if (error) throw error;
    const all = profiles || [];

    // Historical archive of hard-deleted accounts (requires the SQL migration
    // — safely treated as 0 if the table doesn't exist yet).
    let archivedCount = 0;
    const { count, error: archiveError } = await supabaseAdmin
      .from('deleted_customers')
      .select('id', { count: 'exact', head: true });
    if (!archiveError && typeof count === 'number') {
      archivedCount = count;
    }

    const totalCount = all.length + archivedCount;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newCount = all.filter((p) => p.created_at && new Date(p.created_at) >= sevenDaysAgo).length;

    // Previous 7-day window (day -14 to day -7) — used only for the dashboard's
    // "New Customers" week-over-week trend badge.
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const previousWeekCount = all.filter((p) => {
      if (!p.created_at) return false;
      const created = new Date(p.created_at);
      return created >= fourteenDaysAgo && created < sevenDaysAgo;
    }).length;
    const newCustomersTrend = computeTrend(newCount, previousWeekCount);

    const activeCount = all.filter((p) => (p.Status || '').toLowerCase() === 'active').length;

    let repeatCount = 0;
    if (all.length > 0) {
      const ids = all.map((p) => p.id);
      const { data: orders, error: ordersError } = await supabaseAdmin
        .from('orders')
        .select('customer_id')
        .in('customer_id', ids);

      if (!ordersError) {
        const orderCounts = {};
        for (const o of orders || []) {
          orderCounts[o.customer_id] = (orderCounts[o.customer_id] || 0) + 1;
        }
        repeatCount = Object.values(orderCounts).filter((c) => c >= 2).length;
      }
    }

    res.json({
      success: true,
      stats: {
        total_customers: totalCount,
        new_customers: newCount,
        new_customers_trend_percent: newCustomersTrend.percent,
        new_customers_trend_direction: newCustomersTrend.direction,
        active_customers: activeCount,
        repeat_customers: repeatCount,
      },
    });
  } catch (err) {
    console.error('[AdminCustomers] getCustomerStats error:', err.message);
    next(err);
  }
}

/**
 * GET /api/admin/customers/:id
 * Full profile row (including preference fields) for the edit drawer.
 * Always fetched fresh by id — never trusts client-cached data.
 */
export async function getCustomerById(req, res, next) {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('Profiles')
      .select(PROFILE_FULL_COLUMNS)
      .eq('id', id)
      .single();

    if (error) throw error;
    res.json({ success: true, customer: data });
  } catch (err) {
    console.error('[AdminCustomers] getCustomerById error:', err.message);
    next(err);
  }
}

/**
 * PATCH /api/admin/customers/:id
 * Updates only the whitelisted Profiles columns (mirrors the customer's own
 * Profile section fields, plus admin-managed Status). Never touches
 * avatar_url/email/role or Supabase Auth.
 */
export async function updateCustomerById(req, res, next) {
  try {
    const { id } = req.params;
    const body = req.body || {};

    const payload = {};
    for (const key of ALLOWED_UPDATE_FIELDS) {
      if (key in body && body[key] !== undefined) {
        payload[key] = body[key];
      }
    }

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    payload.Updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('Profiles')
      .update(payload)
      .eq('id', id)
      .select(PROFILE_FULL_COLUMNS)
      .single();

    if (error) throw error;
    res.json({ success: true, customer: data });
  } catch (err) {
    console.error('[AdminCustomers] updateCustomerById error:', err.message);
    next(err);
  }
}

/**
 * DELETE /api/admin/customers/:id
 * Permanently deletes a customer (Supabase Auth user + Profiles row).
 * Mirrors accountController.deleteMyAccount's snapshot/archive/fallback
 * logic, generalised for an admin acting on any non-admin customer id.
 *
 *   1. Snapshot + archive into `deleted_customers` so the historical
 *      "Total Customers" KPI never drops (best-effort — table optional).
 *   2. Hard-delete the Profiles row. If blocked by a foreign key
 *      (orders/payments/etc. still reference it), fall back to marking it
 *      Status='inactive' instead of blocking the whole delete flow.
 *   3. Delete the Supabase Auth user.
 */
export async function deleteCustomerById(req, res, next) {
  try {
    const { id } = req.params;

    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('Profiles')
      .select('id, full_name, email, phone, role, Status, created_at')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    if (profile.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Admin accounts cannot be deleted from this page' });
    }

    const { error: deleteProfileError } = await supabaseAdmin
      .from('Profiles')
      .delete()
      .eq('id', id);

    if (!deleteProfileError) {
      const { error: archiveError } = await supabaseAdmin.from('deleted_customers').insert({
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        role: profile.role,
        status: profile.Status,
        registered_at: profile.created_at,
      });
      if (archiveError) {
        // Non-fatal: the profile is already gone; this is only a secondary
        // historical record for the stats KPI.
        console.error('[AdminCustomers] deleted_customers archive insert failed:', archiveError.message);
      }
    } else if (deleteProfileError.code === '23503') {
      // Foreign-key violation — other rows still reference this profile.
      // Keep the row but deactivate it so it stops showing as "Active".
      const { error: deactivateError } = await supabaseAdmin
        .from('Profiles')
        .update({ Status: 'inactive', Updated_at: new Date().toISOString() })
        .eq('id', id);
      if (deactivateError) {
        console.error('[AdminCustomers] fallback deactivate failed:', deactivateError.message);
      }
    } else {
      console.error('[AdminCustomers] Profiles delete error:', deleteProfileError.message);
      return res.status(500).json({ success: false, message: 'Failed to delete customer' });
    }

    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (authDeleteError) {
      console.error('[AdminCustomers] auth deleteUser error:', authDeleteError.message);
      return res.status(500).json({ success: false, message: 'Failed to delete customer account' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('[AdminCustomers] deleteCustomerById error:', err.message);
    next(err);
  }
}
