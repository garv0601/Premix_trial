export const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const fetchProducts = async (filters = {}) => {
  const query = new URLSearchParams();
  if (filters.category && filters.category !== 'All') query.append('category', filters.category);
  if (filters.search) query.append('search', filters.search);
  if (filters.maxPrice) query.append('maxPrice', filters.maxPrice);
  if (filters.minRating) query.append('minRating', filters.minRating);
  if (filters.sortBy) query.append('sortBy', filters.sortBy);

  const res = await fetch(`${BASE_URL}/products?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
};

export const fetchProductById = async (id) => {
  const res = await fetch(`${BASE_URL}/products/${id}`);
  if (!res.ok) throw new Error('Failed to fetch product details');
  return res.json();
};

export const fetchProductReviews = async (productId) => {
  const res = await fetch(`${BASE_URL}/reviews/product/${productId}`);
  if (!res.ok) throw new Error('Failed to fetch reviews');
  return res.json();
};

export const submitProductReview = async (reviewData) => {
  const res = await fetch(`${BASE_URL}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reviewData)
  });
  if (!res.ok) throw new Error('Failed to submit review');
  return res.json();
};
