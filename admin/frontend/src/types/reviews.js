/**
 * Review data types for ANNAPURNA Admin.
 * Prepared for Supabase migration.
 */

/**
 * @typedef {'pending' | 'approved' | 'rejected'} ReviewStatus
 */

/**
 * @typedef {Object} Review
 * @property {string} id
 * @property {string} customer_id
 * @property {string} customer_name
 * @property {string|null} customer_avatar
 * @property {string} product_id
 * @property {string} product_name
 * @property {number} rating - 1 to 5
 * @property {string} review_text
 * @property {ReviewStatus} status
 * @property {string} created_at
 */

/**
 * @typedef {Object} ReviewStats
 * @property {number} average_rating
 * @property {number} total_reviews
 * @property {number} pending_approval
 */
