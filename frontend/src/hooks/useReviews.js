import { useState, useEffect, useCallback } from 'react';
import { fetchProductReviews, submitProductReview } from '../services/api';
import { useRegisterRefresh } from '../context/RefreshContext';

export const useReviews = (productId) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadReviews = useCallback(async () => {
    if (!productId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetchProductReviews(productId);
      setReviews(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  useRegisterRefresh(loadReviews);

  const addReview = async (reviewData) => {
    const res = await submitProductReview({ ...reviewData, productId });
    if (res.success) {
      setReviews(prev => [res.data, ...prev]);
    }
    return res;
  };

  return { reviews, loading, error, addReview, refetch: loadReviews };
};
