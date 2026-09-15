/**
 * Product data types for ANNAPURNA Admin.
 * Maps to the existing Supabase schema: public.products
 *
 * Schema columns:
 *   id, name, description, category, price, image,
 *   sku, stock_quantity, status, created_at, updated_at
 */

/**
 * @typedef {'in_stock'|'low_stock'|'out_of_stock'|'inactive'} ProductStatus
 */

/**
 * @typedef {'breakfast'|'lunch'|'dinner'|'snacks'|'desserts'} ProductCategory
 */

/**
 * @typedef {Object} Product
 * @property {string}          id
 * @property {string}          name
 * @property {string}          description
 * @property {ProductCategory} category
 * @property {number}          price
 * @property {string|null}     image          — URL from Supabase Storage
 * @property {string}          sku
 * @property {number}          stock_quantity
 * @property {ProductStatus}   status
 * @property {string}          created_at     — ISO timestamp
 * @property {string}          updated_at     — ISO timestamp
 */

/**
 * @typedef {Object} ProductFormData
 * @property {string}          name
 * @property {string}          description
 * @property {ProductCategory} category
 * @property {number}          price
 * @property {string}          sku
 * @property {number}          stock_quantity
 * @property {ProductStatus}   status
 * @property {string|null}     image
 */

export default {};
