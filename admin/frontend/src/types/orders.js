/**
 * Order data types for ANNAPURNA Admin.
 * Mirrors the Supabase schema: public.orders, profiles, order_items, payments, coupons.
 *
 * Relationships:
 *   orders.customer_id  → profiles.id
 *   orders.id           → order_items.order_id
 *   orders.id           → payments.order_id
 *   orders.coupon_id    → coupons.id
 */

/**
 * @typedef {'pending'|'confirmed'|'processing'|'shipped'|'out_for_delivery'|'delivered'|'cancelled'|'refunded'} OrderStatus
 */

/**
 * @typedef {'upi'|'card'|'cod'|'netbanking'} PaymentMethod
 */

/**
 * @typedef {'paid'|'pending'|'failed'|'refunded'} PaymentStatus
 */

/**
 * @typedef {Object} OrderCustomer
 * @property {string} id              - profiles.id
 * @property {string} fullName        - profiles.full_name
 * @property {string} [phone]         - profiles.phone
 * @property {string} [email]         - profiles.email
 * @property {string} [avatarUrl]     - profiles.avatar_url
 */

/**
 * @typedef {Object} OrderItem
 * @property {string} id              - order_items.id
 * @property {string} productId       - order_items.product_id
 * @property {string} productName     - products.name (joined)
 * @property {number} quantity        - order_items.quantity
 * @property {number} unitPrice       - order_items.unit_price
 * @property {number} subtotal        - quantity * unitPrice
 * @property {string} [productImage]  - products.image (joined)
 */

/**
 * @typedef {Object} OrderPayment
 * @property {string} id              - payments.id
 * @property {PaymentMethod} method   - payments.method
 * @property {PaymentStatus} status   - payments.status
 * @property {string} [transactionId] - payments.transaction_id
 */

/**
 * @typedef {Object} OrderCoupon
 * @property {string} id              - coupons.id
 * @property {string} code            - coupons.code
 * @property {number} discountValue   - coupons.discount_value
 * @property {string} discountType    - coupons.discount_type ('percent' | 'flat')
 */

/**
 * @typedef {Object} Order
 * @property {string} id              - orders.id
 * @property {string} orderId         - Human-readable order ID, e.g. "#ORD-9082"
 * @property {OrderCustomer} customer
 * @property {string} date            - orders.created_at (formatted)
 * @property {number} amount          - orders.total_amount
 * @property {number} [subtotal]      - orders.subtotal
 * @property {number} [discount]      - orders.discount
 * @property {OrderStatus} status     - orders.status
 * @property {OrderPayment} payment
 * @property {OrderItem[]} [items]    - populated in detail view
 * @property {OrderCoupon} [coupon]   - if coupon was applied
 */

/**
 * @typedef {Object} OrderStats
 * @property {number} pending
 * @property {number} shipped
 * @property {number} delivered
 * @property {number} cancelled
 * @property {string} [pendingTrend]
 * @property {string} [shippedTrend]
 * @property {string} [deliveredTrend]
 * @property {string} [cancelledTrend]
 */

export default {};
