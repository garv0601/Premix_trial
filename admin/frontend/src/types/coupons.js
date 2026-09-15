/**
 * Coupon data types for ANNAPURNA Admin.
 * Mirrors the real `public.coupons` Supabase table (see admin/DATABASE_SCHEMA.md §8).
 */

/**
 * @typedef {'active' | 'inactive' | 'expired' | 'scheduled'} CouponStatus - derived client-side, not a DB column
 * @typedef {'percentage' | 'fixed'} DiscountType
 */

/**
 * @typedef {Object} Coupon
 * @property {string} id - UUID
 * @property {string} code - The coupon code string (e.g. WELCOME20)
 * @property {string|null} description
 * @property {DiscountType} discount_type
 * @property {number} discount_value
 * @property {number} minimum_order_amount
 * @property {number|null} maximum_discount
 * @property {number|null} usage_limit
 * @property {number} used_count
 * @property {string|null} starts_at - ISO timestamp
 * @property {string|null} expires_at - ISO timestamp
 * @property {boolean} is_active
 * @property {CouponStatus} status - derived: inactive/expired/scheduled/active
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} CouponStats
 * @property {number} total_coupons
 * @property {number} active_coupons
 * @property {number} expiring_soon
 * @property {number} total_usage
 */

