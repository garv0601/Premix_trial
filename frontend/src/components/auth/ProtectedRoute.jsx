/**
 * ANNAPURNA — ProtectedRoute
 *
 * Wraps any route that requires authentication.
 *
 * Behaviour:
 *  - While auth is loading → renders nothing (avoids flash)
 *  - If authenticated     → renders children normally
 *  - If not authenticated → redirects to /login, passing the
 *    intended destination as ?redirect=<path> so the user
 *    lands exactly where they meant to go after signing in.
 *
 * Usage in App.jsx:
 *   <Route path="/checkout" element={
 *     <ProtectedRoute>
 *       <CheckoutPage />
 *     </ProtectedRoute>
 *   } />
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Render nothing while auth state is being determined.
    // The brief flash is imperceptible; a full spinner here
    // would be more disruptive than helpful.
    return null;
  }

  if (!isAuthenticated) {
    // Encode the current path as the post-login redirect destination
    const redirectParam = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectParam}`} replace />;
  }

  return children;
}
