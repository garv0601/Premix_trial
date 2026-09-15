import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider } from './context/AdminAuthContext';
import ProtectedAdminRoute from './components/auth/ProtectedAdminRoute';
import AdminLayout from './components/layout/AdminLayout';
import AdminLogin from './pages/Login/AdminLogin';
import Dashboard from './pages/Dashboard/Dashboard';
import Orders from './pages/Orders/Orders';
import ProductManagement from './pages/ProductManagement/ProductManagement';
import Customers from './pages/Customers/Customers';
import Coupons from './pages/Coupons/Coupons';
import Reviews from './pages/Reviews/Reviews';

/**
 * ANNAPURNA Admin root.
 * 
 * Auth flow:
 *   /admin/login  → public login page
 *   /admin/*      → protected by ProtectedAdminRoute (session + admin_users check)
 */
export default function App() {
  return (
    <AdminAuthProvider>
      <Routes>
        {/* Public route — Admin Login */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected admin routes — wrapped in auth guard + layout */}
        <Route
          path="/*"
          element={
            <ProtectedAdminRoute>
              <AdminLayout>
                <Routes>
                  {/* Default redirects */}
                  <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

                  {/* Active pages */}
                  <Route path="/admin/dashboard" element={<Dashboard />} />
                  <Route path="/admin/orders" element={<Orders />} />
                  <Route path="/admin/products" element={<ProductManagement />} />
                  <Route path="/admin/customers" element={<Customers />} />
                  <Route path="/admin/coupons" element={<Coupons />} />
                  <Route path="/admin/reviews" element={<Reviews />} />

                  {/* Catch-all → dashboard */}
                  <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                </Routes>
              </AdminLayout>
            </ProtectedAdminRoute>
          }
        />
      </Routes>
    </AdminAuthProvider>
  );
}
