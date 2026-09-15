import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import './AdminLogin.css';

/**
 * ADMIN LOGIN PAGE
 * 
 * Uses the ANNAPURNA design system for a warm, branded login experience.
 * Connects to Supabase Auth via the AdminAuthContext.
 */
export default function AdminLogin() {
  const { login, isAuthenticated, loading: authLoading, error: authError, setError } = useAdminAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // If already authenticated, redirect to dashboard
  if (authLoading) {
    return (
      <div className="admin-auth-loading" id="admin-login-loading">
        <div className="admin-auth-loading-inner">
          <div className="admin-auth-spinner" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    setSubmitting(true);
    const result = await login(email.trim(), password);
    setSubmitting(false);
    // On success, isAuthenticated becomes true → Navigate fires above
  };

  return (
    <div className="admin-login-page" id="admin-login-page">
      <motion.div
        className="admin-login-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        {/* Brand Header */}
        <div className="admin-login-brand">
          <div className="admin-login-brand-icon">
            <span>अ</span>
          </div>
          <h1 className="admin-login-title">ANNAPURNA</h1>
          <p className="admin-login-subtitle">Admin Portal</p>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {authError && (
            <motion.div
              className="admin-login-error"
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.2 }}
            >
              <AlertCircle size={16} />
              <span>{authError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Login Form */}
        <form className="admin-login-form" onSubmit={handleSubmit} noValidate>
          <div className="admin-login-field">
            <label className="admin-login-label" htmlFor="admin-email">Email Address</label>
            <div className="admin-login-input-wrap">
              <Mail size={18} className="admin-login-input-icon" />
              <input
                id="admin-email"
                type="email"
                className="admin-login-input"
                placeholder="admin@annapurna.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                disabled={submitting}
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          <div className="admin-login-field">
            <label className="admin-login-label" htmlFor="admin-password">Password</label>
            <div className="admin-login-input-wrap">
              <Lock size={18} className="admin-login-input-icon" />
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                className="admin-login-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                disabled={submitting}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="admin-login-eye-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <motion.button
            type="submit"
            className="admin-login-submit"
            id="admin-login-button"
            disabled={submitting}
            whileHover={!submitting ? { scale: 1.01 } : {}}
            whileTap={!submitting ? { scale: 0.99 } : {}}
          >
            {submitting ? (
              <>
                <div className="admin-login-btn-spinner" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </motion.button>
        </form>

        <p className="admin-login-footer-text">
          Maa's Kitchen — Admin Access Only
        </p>
      </motion.div>
    </div>
  );
}
