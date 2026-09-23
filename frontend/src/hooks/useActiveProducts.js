/**
 * useActiveProducts
 *
 * Fetches only active (is_active = true) products from Supabase.
 * Maps DB column names to the shape that ShopPage / ShopProductCard expects.
 *
 * Field mapping:
 *   DB             → UI
 *   image_url      → image
 *   short_description → shortDescription
 *   categories.name → category
 *   is_bestseller  → badge ('Bestseller' | null, merged with is_featured → 'New')
 *   (no packSize / currency in DB — use sensible defaults)
 */

import { useState, useEffect, useCallback } from 'react';
import supabase from '../lib/supabase';
import { useRegisterRefresh } from '../context/RefreshContext';

/**
 * Derive a simple badge string from product flags.
 * Keeps parity with the static mock data badge field.
 */
function deriveBadge(row) {
  if (row.is_bestseller) return 'Bestseller';
  if (row.is_featured)   return 'New';
  return null;
}

/**
 * Map a raw Supabase products row → the shape ShopProductCard expects.
 */
function mapProductForShop(row) {
  const categoryData = row.categories; // { id, name, slug }
  return {
    // Identity
    id:               row.id,
    slug:             row.slug,
    // Display
    name:             row.name,
    shortDescription: row.short_description || '',
    category:         categoryData?.name || '',
    image:            row.image_url || '',
    // Pricing
    price:            Number(row.price) || 0,
    compareAtPrice:   row.compare_at_price != null ? Number(row.compare_at_price) : null,
    currency:         '₹',
    packSize:         row.servings ? `${row.weight || ''} (${row.servings})`.trim() : (row.weight || ''),
    // Badges
    badge:            deriveBadge(row),
    // Inventory — used for sold-out detection
    stock_quantity:   row.stock_quantity ?? 0,
    // Visibility (already guaranteed true by the query, but kept for safety)
    is_active:        row.is_active,
    // Extra
    is_featured:      row.is_featured,
    is_bestseller:    row.is_bestseller,
  };
}

/**
 * Hook: returns only active products from the DB.
 * Falls back to an empty array if Supabase is not configured.
 */
export function useActiveProducts() {
  const [products, setProducts]   = useState([]);
  const [loading,  setLoading]    = useState(true);
  const [error,    setError]      = useState(null);

  const fetchActive = useCallback(async () => {
    // Guard: Supabase client may be null when env vars are missing
    if (!supabase) {
      console.warn('[useActiveProducts] Supabase not configured — returning empty list.');
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: sbError } = await supabase
        .from('products')
        .select(`
          id,
          slug,
          name,
          short_description,
          price,
          compare_at_price,
          weight,
          servings,
          image_url,
          stock_quantity,
          is_active,
          is_featured,
          is_bestseller,
          categories ( id, name, slug )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (sbError) throw sbError;

      setProducts((data || []).map(mapProductForShop));
    } catch (err) {
      console.error('[useActiveProducts] fetch error:', err);
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActive();
  }, [fetchActive]);

  useRegisterRefresh(fetchActive);

  return { products, loading, error, refetch: fetchActive };
}

/**
 * Map a raw Supabase products row → the shape ProductDetailPage expects.
 *
 * Builds on mapProductForShop (same id/slug/name/price/image/stock fields used
 * by the cart) and adds the extra detail-page fields that already exist in the
 * DB: full `description`, `compare_at_price` (→ mrp) and the `images` gallery
 * array. Badges are derived from the existing is_bestseller / is_featured
 * flags, the same way the shop card does.
 *
 * Fields the DB does not have (e.g. prep time, "Maa's Tip") are intentionally
 * left out — ProductDetailPage already hides those sections when absent.
 */
function mapProductForDetail(row) {
  const base = mapProductForShop(row);
  const gallery = Array.isArray(row.images) && row.images.length > 0
    ? row.images
    : (row.image_url ? [row.image_url] : []);

  const badges = [];
  if (row.is_bestseller) badges.push('Bestseller');
  if (row.is_featured)   badges.push('New');

  return {
    ...base,
    description: row.description || '',
    mrp:         row.compare_at_price ? Number(row.compare_at_price) : null,
    images:      gallery,
    badges,
  };
}

/**
 * Hook: fetches a single active product by slug for the Product Detail page.
 *
 * Falls back to an empty state (product: null) if Supabase is not configured,
 * the product doesn't exist, or it isn't active — the caller (ProductDetailPage)
 * distinguishes "loading" / "error" / "not found" using the returned state.
 */
export function useProductBySlug(slug) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchProduct = useCallback(async () => {
    if (!slug) {
      setProduct(null);
      setLoading(false);
      return;
    }

    if (!supabase) {
      console.warn('[useProductBySlug] Supabase not configured — cannot load product.');
      setProduct(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: sbError } = await supabase
        .from('products')
        .select(`
          id,
          slug,
          name,
          description,
          short_description,
          price,
          compare_at_price,
          weight,
          servings,
          image_url,
          images,
          stock_quantity,
          is_active,
          is_featured,
          is_bestseller,
          categories ( id, name, slug )
        `)
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (sbError) throw sbError;

      setProduct(data ? mapProductForDetail(data) : null);
    } catch (err) {
      console.error('[useProductBySlug] fetch error:', err);
      setError(err.message || 'Failed to load product');
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  useRegisterRefresh(fetchProduct);

  return { product, loading, error, refetch: fetchProduct };
}

/**
 * Hook: returns active + featured products for the Home page Featured section.
 *
 * Filters: is_active = true AND is_featured = true
 *
 * Reuses mapProductForShop so product shape is identical to ShopPage cards.
 * Falls back to an empty array if Supabase is not configured.
 */
export function useFeaturedProducts() {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const fetchFeatured = useCallback(async () => {
    if (!supabase) {
      console.warn('[useFeaturedProducts] Supabase not configured — returning empty list.');
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: sbError } = await supabase
        .from('products')
        .select(`
          id,
          slug,
          name,
          short_description,
          price,
          weight,
          servings,
          image_url,
          stock_quantity,
          is_active,
          is_featured,
          is_bestseller,
          categories ( id, name, slug )
        `)
        .eq('is_active',  true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false });

      if (sbError) throw sbError;

      setProducts((data || []).map(mapProductForShop));
    } catch (err) {
      console.error('[useFeaturedProducts] fetch error:', err);
      setError(err.message || 'Failed to load featured products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeatured();
  }, [fetchFeatured]);

  useRegisterRefresh(fetchFeatured);

  return { products, loading, error, refetch: fetchFeatured };
}
