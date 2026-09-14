/**
 * CUSTOMER SERVICE — Admin Customers page
 *
 * Talks to the backend's admin customer API (/api/admin/customers), which
 * uses the SERVICE-ROLE client server-side. Direct anon-key reads/writes on
 * `Profiles` from the browser are blocked by RLS (by design, to protect
 * customer data), so all customer reads/writes for this page go through the
 * backend — the same pattern already used for admin Orders
 * (services/orderService.js).
 *
 * IMPORTANT column casing (as per DATABASE_SCHEMA.md):
 *   - Profiles.Status     → capital 'S'
 *   - Profiles.Updated_at → capital 'U'
 */

import { supabase } from '../lib/supabase';
import { API_BASE_URL } from '../lib/apiConfig';

// Locally, the Vite dev proxy forwards /api → http://localhost:5000/api
// (via VITE_BACKEND_URL in .env). In production this resolves to the
// deployed backend's public base URL — see lib/apiConfig.js.
const BACKEND_API = API_BASE_URL;

/** Get the admin's current Supabase session access token. */
async function getAdminToken() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}

async function authedFetch(path, options = {}) {
  const token = await getAdminToken();
  const res = await fetch(`${BACKEND_API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok || body?.success === false) {
    throw new Error(body?.message || 'Request failed. Please try again.');
  }

  return body;
}

/* ══════════════════════════════════════════════════════════════
   FETCH ALL CUSTOMERS  (with order aggregates)
   ══════════════════════════════════════════════════════════════ */

/**
 * Fetch all customer profiles (excluding admins) enriched with order
 * aggregates (total orders, total spent, last order date).
 */
export async function getCustomers() {
  try {
    const { customers } = await authedFetch('/admin/customers');
    return customers || [];
  } catch (err) {
    console.error('getCustomers error:', err);
    throw new Error('Unable to load customers. Please try again.');
  }
}

/* ══════════════════════════════════════════════════════════════
   CUSTOMER STATISTICS (KPIs)
   ══════════════════════════════════════════════════════════════ */

/**
 * Real customer statistics:
 *   - total_customers   → EVERY customer who ever registered. Includes
 *                         active AND deactivated (Status = 'inactive')
 *                         profiles, plus any hard-deleted accounts archived
 *                         into `deleted_customers`. A deactivated/deleted
 *                         account must NEVER shrink this historical count.
 *   - new_customers     → created within the LAST 7 DAYS
 *   - active_customers  → Status = 'active' (case-insensitive), i.e. not
 *                         deactivated/deleted
 *   - repeat_customers  → customers with 2 or more orders
 */
export async function getCustomerStats() {
  try {
    const { stats } = await authedFetch('/admin/customers/stats');
    return stats;
  } catch (err) {
    console.error('getCustomerStats error:', err);
    throw new Error('Unable to load customer statistics.');
  }
}

/* ══════════════════════════════════════════════════════════════
   SINGLE CUSTOMER PROFILE (for the edit modal)
   ══════════════════════════════════════════════════════════════ */

/**
 * Fetch the full profile row for ONE customer, including every editable
 * field that also exists in the customer-facing Profile section.
 *
 * Always fetched fresh (by id) when the admin opens the edit modal so the
 * form can never show a stale or a different customer's data.
 */
export async function getCustomerProfile(customerId) {
  try {
    const { customer } = await authedFetch(`/admin/customers/${customerId}`);
    return customer;
  } catch (err) {
    console.error('getCustomerProfile error:', err);
    throw new Error('Unable to load customer profile. Please try again.');
  }
}

/* ══════════════════════════════════════════════════════════════
   UPDATE CUSTOMER PROFILE (admin edit — writes existing columns only)
   ══════════════════════════════════════════════════════════════ */

/**
 * Update a customer's profile in the existing `Profiles` table.
 *
 * Only writes the same fields the customer can edit in their own Profile
 * section (name, phone, date of birth, preferences, communication toggles)
 * plus the admin-managed account Status. The backend whitelists these
 * columns server-side too — avatar_url/email/role/passwords can never be
 * modified from this screen.
 */
export async function updateCustomerProfile(customerId, fields) {
  try {
    const { customer } = await authedFetch(`/admin/customers/${customerId}`, {
      method: 'PATCH',
      body: JSON.stringify(fields),
    });
    return customer;
  } catch (err) {
    console.error('updateCustomerProfile error:', err);
    throw new Error(err.message || 'Unable to save customer changes. Please try again.');
  }
}

/* ══════════════════════════════════════════════════════════════
   CUSTOMER DEACTIVATION (safe — no auth deletion)
   ══════════════════════════════════════════════════════════════ */

/**
 * Deactivate a customer by setting their Status to 'inactive'.
 *
 * IMPORTANT: This does NOT delete the user from auth.users.
 */
export async function deactivateCustomer(customerId) {
  return updateCustomerProfile(customerId, { Status: 'inactive' });
}

/**
 * Reactivate a customer by setting their Status to 'active'.
 */
export async function activateCustomer(customerId) {
  return updateCustomerProfile(customerId, { Status: 'active' });
}

/* ══════════════════════════════════════════════════════════════
   DELETE CUSTOMER (permanent — admin action, cannot be undone)
   ══════════════════════════════════════════════════════════════ */

/**
 * Permanently delete a customer's account (Supabase Auth user + Profiles
 * row). The backend archives a snapshot into `deleted_customers` first so
 * historical stats never drop. There is no undo.
 */
export async function deleteCustomer(customerId) {
  try {
    await authedFetch(`/admin/customers/${customerId}`, { method: 'DELETE' });
    return true;
  } catch (err) {
    console.error('deleteCustomer error:', err);
    throw new Error(err.message || 'Unable to delete customer. Please try again.');
  }
}
