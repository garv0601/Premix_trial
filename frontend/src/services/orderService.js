/**
 * ANNPURNA — Order Service (Frontend)
 *
 * Fetches real orders from the backend API which queries Supabase.
 * The authenticated Supabase JWT is passed as a Bearer token so the
 * backend can verify the user server-side.
 *
 * No mock data is used here. Orders come from Supabase via the backend.
 */

import supabase from '../lib/supabase';
import { BASE_URL as API_BASE } from './api';

/**
 * Get the current session's JWT to authenticate backend requests.
 */
async function getAuthToken() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}

/**
 * Fetch all orders for the authenticated customer.
 * Orders are filtered by customer_id on the backend — customers cannot
 * fetch other customers' orders.
 *
 * @returns {Promise<Array>} Array of order objects from Supabase
 */
export async function getUserOrders() {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${API_BASE}/orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch orders');
  }

  const { orders } = await res.json();
  return (orders || []).map(normaliseOrder);
}

/**
 * Fetch a single order by ID.
 * Backend enforces ownership — customer cannot fetch another customer's order.
 *
 * @param {string} orderId
 * @returns {Promise<object>} Order object
 */
export async function getOrderById(orderId) {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${API_BASE}/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Order not found');
  }

  const { order } = await res.json();
  return normaliseOrder(order);
}

/**
 * Place an order via the backend.
 * The backend validates the user, recalculates totals, verifies payment,
 * and creates records in Supabase.
 *
 * @param {object} orderPayload
 * @returns {Promise<object>} Confirmed order object
 */
export async function placeOrder(orderPayload) {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${API_BASE}/orders`, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${token}`,
    },
    body: JSON.stringify(orderPayload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to place order');
  }

  return res.json();
}

/**
 * Create a Razorpay order via the backend (for online payments).
 *
 * @param {number} amount  Total amount in INR
 * @returns {Promise<object>} Razorpay order object
 */
export async function createRazorpayOrder(amount) {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${API_BASE}/orders/create-razorpay-order`, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${token}`,
    },
    body: JSON.stringify({ amount }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create payment order');
  }

  return res.json();
}

// ── Normaliser ────────────────────────────────────────────────────────────────
/**
 * Normalise a raw Supabase order to the shape expected by the existing UI components.
 *
 * UI components expect:
 *   order.id            — UUID (used for navigation)
 *   order.createdAt     — ISO date string
 *   order.status        — order_status value
 *   order.total         — total amount number
 *   order.items[]       — array with { name, image, quantity, price }
 *   order.deliveryAddress — { name, address, city, state, pin, phone }
 *   order.subtotal, order.discount, order.deliveryFee, order.taxAmount
 *   order.paymentMethod, order.paymentStatus
 */
function normaliseOrder(raw) {
  const addr = raw.shipping_address || {};

  return {
    id:        raw.id,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    status:    raw.order_status,
    total:     raw.total_amount,
    subtotal:  raw.subtotal,
    discount:  raw.discount_amount,
    deliveryFee:  raw.shipping_amount,
    taxAmount:    raw.tax_amount,
    paymentMethod: raw.payments?.[0]?.payment_method || '',
    paymentStatus: raw.payment_status,

    items: (raw.order_items || []).map(i => ({
      productId: i.product_id,
      name:      i.product_name,
      price:     i.product_price,
      quantity:  i.quantity,
      subtotal:  i.subtotal,
      // No image stored in order_items — use a placeholder
      image:     `https://placehold.co/60x60/FFF8F4/B22222?text=${encodeURIComponent(i.product_name?.slice(0,2) || 'P')}`,
    })),

    deliveryAddress: addr.full_name ? {
      name:    addr.full_name,
      address: addr.address_line1 + (addr.address_line2 ? `, ${addr.address_line2}` : ''),
      city:    addr.city,
      state:   addr.state,
      pin:     addr.postal_code,
      phone:   addr.phone,
    } : null,

    notes: raw.notes,
  };
}
