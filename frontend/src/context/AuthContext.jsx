/**
 * ANNPURNA — Auth Context
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getSession,
  onAuthStateChange,
  signIn  as authSignIn,
  signUp  as authSignUp,
  signOut as authSignOut,
  signInWithGoogle   as authGoogle,
  signInWithFacebook as authFacebook,
  updateProfile      as authUpdateProfile,
  uploadProfileImage,
  sendAuthOtp        as authSendAuthOtp,
  verifyAuthOtp      as authVerifyAuthOtp,
  updatePassword     as authUpdatePassword,
  resetPasswordForEmail as authResetPasswordForEmail,
  listMfaFactors     as authListMfaFactors,
  enrollTotpFactor   as authEnrollTotpFactor,
  verifyTotpFactor   as authVerifyTotpFactor,
  unenrollFactor     as authUnenrollFactor,
  signOutAllDevices  as authSignOutAllDevices,
  deleteAccount      as authDeleteAccount,
  syncProfileRow     as authSyncProfileRow,
  consumeOAuthRedirectPath,
} from '../services/auth';
import { credentialsMissing } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // After a Google/Facebook sign-in, the OAuth redirect always lands on "/"
  // (see services/auth.js — the deployed static host 404s on a fresh
  // top-level request to any other path). Once a session actually exists,
  // send the user on to wherever they originally meant to go (e.g.
  // /account), via a client-side navigation so no further server request —
  // and therefore no risk of another 404 — is involved.
  const restoreOAuthDestination = (activeSession) => {
    const path = consumeOAuthRedirectPath();
    if (path && activeSession) {
      navigate(path, { replace: true });
    }
  };

  useEffect(() => {
    let unsubscribe = () => {};

    const init = async () => {
      if (credentialsMissing) {
        setLoading(false);
        return;
      }

      const { session: existingSession } = await getSession();
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      setLoading(false);
      restoreOAuthDestination(existingSession);

      unsubscribe = onAuthStateChange((_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        restoreOAuthDestination(newSession);
      });
    };

    init();
    return () => unsubscribe();
  }, []);

  const signIn = async (email, password) => authSignIn(email, password);
  const signUp = async (email, password, metadata) => authSignUp(email, password, metadata);
  const signOut = async () => {
    const result = await authSignOut();
    if (!result.error) {
      setUser(null);
      setSession(null);
    }
    return result;
  };

  const signInWithGoogle = async (redirectTo) => authGoogle(redirectTo);
  const signInWithFacebook = async (redirectTo) => authFacebook(redirectTo);

  const updateProfile = async (metadata) => {
    const result = await authUpdateProfile(metadata);
    if (!result.error && result.data?.user) {
      setUser(result.data.user);
    }
    return result;
  };

  // Keeps the admin-facing Profiles table row (full_name/phone/avatar_url) in sync
  const syncProfileRow = async (fields) => authSyncProfileRow(fields);

  // OTP / Passwordless actions
  const sendAuthOtp = async (method, identifier, metadata) => authSendAuthOtp(method, identifier, metadata);
  const verifyAuthOtp = async (method, identifier, token) => authVerifyAuthOtp(method, identifier, token);

  // Security actions
  const updatePassword = async (newPassword) => {
    const result = await authUpdatePassword(newPassword);
    // Keep the local user in sync so the session stays authenticated and the
    // UI flips from "Set Password" to "Change Password" (has_password flag).
    if (!result.error && result.data?.user) {
      setUser(result.data.user);
    }
    return result;
  };
  const resetPasswordForEmail = async (email, redirectTo) => authResetPasswordForEmail(email, redirectTo);
  const listMfaFactors = async () => authListMfaFactors();
  const enrollTotpFactor = async () => authEnrollTotpFactor();
  const verifyTotpFactor = async (factorId, code) => authVerifyTotpFactor(factorId, code);
  const unenrollFactor = async (factorId) => authUnenrollFactor(factorId);

  // Account actions
  const signOutAllDevices = async () => {
    const result = await authSignOutAllDevices();
    if (!result.error) {
      setUser(null);
      setSession(null);
    }
    return result;
  };
  const deleteAccount = async () => {
    const result = await authDeleteAccount();
    if (!result.error) {
      await authSignOut();
      setUser(null);
      setSession(null);
    }
    return result;
  };

  const value = {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    credentialsMissing,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    signInWithFacebook,
    updateProfile,
    syncProfileRow,
    uploadProfileImage,
    sendAuthOtp,
    verifyAuthOtp,
    updatePassword,
    resetPasswordForEmail,
    listMfaFactors,
    enrollTotpFactor,
    verifyTotpFactor,
    unenrollFactor,
    signOutAllDevices,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export default AuthContext;
