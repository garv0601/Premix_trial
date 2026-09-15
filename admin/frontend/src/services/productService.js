/**
 * Product service for ANNAPURNA Admin.
 *
 * Connected to public.products via Supabase.
 * Uses the existing Supabase client from lib/supabase.js.
 *
 * Also fetches public.categories for the category dropdown.
 */

import { supabase } from '../lib/supabase';

/* ── Helper: derive a UI-friendly status from is_active + stock_quantity ── */
export function deriveStatus(isActive, stockQty) {
  if (!isActive) return 'inactive';
  if (stockQty <= 0) return 'out_of_stock';
  if (stockQty <= 10) return 'low_stock';
  return 'in_stock';
}

/* ── Helper: generate a URL-safe slug from a product name ── */
function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/* ── Helper: enrich a raw Supabase product row with computed UI fields ── */
function enrichProduct(row) {
  // The Supabase join returns categories as an object: { id, name, slug, ... }
  const categoryData = row.categories;
  return {
    ...row,
    // Computed fields for backward-compatibility with existing UI components
    status: deriveStatus(row.is_active, row.stock_quantity),
    image: row.image_url,                                       // UI uses `product.image`
    category: categoryData?.name || null,                       // UI uses `product.category`
    category_slug: categoryData?.slug || null,
    // Remove the nested join object to keep the shape clean
    categories: undefined,
  };
}

/* ══════════════════════════════════════════════════════════════
   CATEGORIES
   ══════════════════════════════════════════════════════════════ */

/**
 * Fetch active categories for product forms.
 */
export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('getCategories error:', error);
    throw new Error('Unable to load categories.');
  }

  return data || [];
}

/* ══════════════════════════════════════════════════════════════
   PRODUCTS — READ
   ══════════════════════════════════════════════════════════════ */

/**
 * Fetch all products with joined category name.
 * Supports optional search, category, and status filters.
 */
export async function getProducts({ search = '', category = '', status = '' } = {}) {
  let query = supabase
    .from('products')
    .select(`
      id,
      category_id,
      name,
      slug,
      description,
      short_description,
      price,
      compare_at_price,
      weight,
      servings,
      image_url,
      images,
      sku,
      stock_quantity,
      is_active,
      is_featured,
      is_bestseller,
      created_at,
      updated_at,
      categories ( id, name, slug )
    `)
    .order('created_at', { ascending: false });

  // Server-side search on name, sku, or description
  if (search) {
    query = query.or(
      `name.ilike.%${search}%,sku.ilike.%${search}%,description.ilike.%${search}%`
    );
  }

  // Category filter — filter by category_id
  if (category) {
    query = query.eq('category_id', category);
  }

  const { data, error } = await query;

  if (error) {
    console.error('getProducts error:', error);
    throw new Error('Unable to load products. Please try again.');
  }

  // Enrich rows with computed UI fields
  let products = (data || []).map(enrichProduct);

  // Client-side status filter (status is computed, not a DB column)
  if (status) {
    products = products.filter((p) => p.status === status);
  }

  return products;
}

/**
 * Fetch a single product by ID.
 */
export async function getProductById(id) {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories ( id, name, slug )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('getProductById error:', error);
    throw new Error('Product not found.');
  }

  return enrichProduct(data);
}

/* ══════════════════════════════════════════════════════════════
   PRODUCTS — CREATE
   ══════════════════════════════════════════════════════════════ */

/**
 * Create a new product.
 */
export async function createProduct(productData) {
  // Build the row to insert using the real DB column names
  const row = {
    name: productData.name,
    slug: productData.slug || generateSlug(productData.name),
    category_id: productData.category_id || null,
    description: productData.description || '',
    short_description: productData.short_description || '',
    price: parseFloat(productData.price) || 0,
    compare_at_price: productData.compare_at_price ? parseFloat(productData.compare_at_price) : null,
    weight: productData.weight || '',
    servings: productData.servings || '',
    image_url: productData.image_url || '',
    images: productData.images || [],
    sku: productData.sku || '',
    stock_quantity: parseInt(productData.stock_quantity, 10) || 0,
    is_active: productData.is_active !== undefined ? productData.is_active : true,
    is_featured: productData.is_featured || false,
    is_bestseller: productData.is_bestseller || false,
  };

  const { data, error } = await supabase
    .from('products')
    .insert(row)
    .select(`
      *,
      categories ( id, name, slug )
    `)
    .single();

  if (error) {
    console.error('createProduct error:', error);

    // Handle common DB constraint errors
    if (error.code === '23505') {
      throw new Error('A product with this SKU or slug already exists.');
    }
    throw new Error(error.message || 'Unable to add product. Please try again.');
  }

  return enrichProduct(data);
}

/* ══════════════════════════════════════════════════════════════
   PRODUCTS — UPDATE
   ══════════════════════════════════════════════════════════════ */

/**
 * Update an existing product.
 */
export async function updateProduct(id, updates) {
  // Build only the fields that should be updated
  const row = {};

  if (updates.name !== undefined)              row.name = updates.name;
  if (updates.name !== undefined)              row.slug = updates.slug || generateSlug(updates.name);
  if (updates.category_id !== undefined)       row.category_id = updates.category_id || null;
  if (updates.description !== undefined)       row.description = updates.description || '';
  if (updates.short_description !== undefined) row.short_description = updates.short_description || '';
  if (updates.price !== undefined)             row.price = parseFloat(updates.price) || 0;
  if (updates.compare_at_price !== undefined)  row.compare_at_price = updates.compare_at_price ? parseFloat(updates.compare_at_price) : null;
  if (updates.weight !== undefined)            row.weight = updates.weight || '';
  if (updates.servings !== undefined)          row.servings = updates.servings || '';
  if (updates.image_url !== undefined)         row.image_url = updates.image_url || '';
  if (updates.images !== undefined)            row.images = updates.images || [];
  if (updates.sku !== undefined)               row.sku = updates.sku || '';
  if (updates.stock_quantity !== undefined)     row.stock_quantity = parseInt(updates.stock_quantity, 10) || 0;
  if (updates.is_active !== undefined)         row.is_active = updates.is_active;
  if (updates.is_featured !== undefined)       row.is_featured = updates.is_featured;
  if (updates.is_bestseller !== undefined)     row.is_bestseller = updates.is_bestseller;

  // updated_at is set by DB trigger if configured; otherwise set it here
  row.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('products')
    .update(row)
    .eq('id', id)
    .select(`
      *,
      categories ( id, name, slug )
    `)
    .single();

  if (error) {
    console.error('updateProduct error:', error);
    if (error.code === '23505') {
      throw new Error('A product with this SKU or slug already exists.');
    }
    throw new Error(error.message || 'Unable to update product. Please try again.');
  }

  return enrichProduct(data);
}

/* ══════════════════════════════════════════════════════════════
   PRODUCTS — DEACTIVATE / DELETE
   ══════════════════════════════════════════════════════════════ */

/**
 * Soft-delete a product by setting is_active = false.
 * This preserves historical order_items references.
 */
export async function deactivateProduct(id) {
  return updateProduct(id, { is_active: false });
}

/**
 * Hard-delete a product.
 * Only safe when no order_items reference this product.
 * Falls back to deactivation if a foreign-key violation occurs.
 */
export async function deleteProduct(id) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('deleteProduct error:', error);

    // Foreign key violation — product is referenced by order_items
    if (error.code === '23503') {
      console.warn('Product is referenced by orders. Falling back to deactivation.');
      return deactivateProduct(id);
    }
    throw new Error('Unable to remove product. Please try again.');
  }

  return { success: true };
}

/**
 * Update product stock quantity.
 */
export async function updateProductStock(id, quantity) {
  return updateProduct(id, { stock_quantity: quantity });
}

/* ══════════════════════════════════════════════════════════════
   PRODUCTS — VISIBILITY TOGGLE
   ══════════════════════════════════════════════════════════════ */

/**
 * Toggle product visibility by updating only is_active.
 * Used by the Admin Products page visibility checkbox.
 *
 * @param {string} id       - Product UUID
 * @param {boolean} isActive - true = visible to customers, false = hidden
 * @returns {Promise<Object>} Enriched product row
 */
export async function updateProductVisibility(id, isActive) {
  const { data, error } = await supabase
    .from('products')
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(`
      *,
      categories ( id, name, slug )
    `)
    .single();

  if (error) {
    console.error('updateProductVisibility error:', error);
    throw new Error(error.message || 'Unable to update product visibility.');
  }

  return enrichProduct(data);
}
