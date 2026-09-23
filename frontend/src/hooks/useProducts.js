import { useState, useEffect, useCallback } from 'react';
import { fetchProducts, fetchProductById } from '../services/api';
import { useRegisterRefresh } from '../context/RefreshContext';

export const useProducts = (initialFilters = {}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchProducts(filters);
      setProducts(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useRegisterRefresh(loadProducts);

  return { products, loading, error, filters, setFilters, refetch: loadProducts };
};
