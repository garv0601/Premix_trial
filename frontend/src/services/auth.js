/**
 * ANNPURNA — Authentication Service
 *
 * All Supabase auth calls go through this module.
 */

import supabase, { credentialsMissing } from '../lib/supabase';

/**
 * Resolve the base site URL used for auth redirects.
 *
 * - By default it uses `window.location.origin`, so it automatically points to
 *   `http://localhost:3000` during local development and to the real deployed
 *   origin (e.g. `https://premix-trial-1.onrender.com`) in production.
 * - It can be explicitly overridden with `VITE_SITE_URL` if a canonical domain
 *   must be forced (e.g. behind a proxy/CDN). Leave it unset to rely on origin.
 */
export const getSiteUrl = () => {
  const configured = import.meta.env.VITE_SITE_URL?.trim();
  const base = configured || (typeof window !== 'undefined' ? window.location.origin : '');
  return base.replace(/\/+$/, '');
};

/**
 * Build an absolute redirect URL for auth flows from a relative path.
 * Centralises redirect construction so login/signup/reset stay consistent
 * and environment-aware.
 */
export const buildAuthRedirectUrl = (path = '/') => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getSiteUrl()}${normalizedPath}`;
};

const notConfigured = () => ({
  data: null,
  error: {
    message: 'Supabase is not configured. Add your credentials to .env.local and restart the dev server.',
    code: 'not_configured',
  },
});

// ── Passwordless Sign Up / Sign In ───────────────────────────────────────────

/**
 * Send an OTP/Magic Link for Sign Up.
 * Creates the user if they don't exist.
 */
export const sendAuthOtp = async (method, identifier, metadata = {}) => {
  if (credentialsMissing) return notConfigured();

  const options = {
    shouldCreateUser: true,
    data: {
      full_name: metadata.fullName ?? '',
      mobile: metadata.mobile ?? '',
      email: metadata.email ?? '', // Store the other identifier in metadata just in case
    },
  };

  if (method === 'email') {
    return await supabase.auth.signInWithOtp({ email: identifier, options });
  } else {
    // Supabase phone OTP expects E.164 format (e.g. +91...)
    const phone = identifier.startsWith('+') ? identifier : `+91${identifier}`;
    return await supabase.auth.signInWithOtp({ phone, options });
  }
};

/**
 * Verify a phone or email OTP.
 */
export const verifyAuthOtp = async (method, identifier, token) => {
  if (credentialsMissing) return notConfigured();

  if (method === 'email') {
    return await supabase.auth.verifyOtp({ email: identifier, token, type: 'email' });
  } else {
    const phone = identifier.startsWith('+') ? identifier : `+91${identifier}`;
    return await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
  }
};

// ── Legacy Password-based functions (kept for compatibility) ───────────────

export const signUp = async (email, password, metadata = {}) => {
  if (credentialsMissing) return notConfigured();
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: metadata.fullName ?? '',
        mobile: metadata.mobile ?? '',
      },
    },
  });
};

export const signIn = async (email, password) => {
  if (credentialsMissing) return notConfigured();
  return await supabase.auth.signInWithPassword({ email, password });
};

/**
 * Send a password-reset email. The link returns the user to /reset-password
 * with a temporary recovery session (detectSessionInUrl handles the token).
 */
export const resetPasswordForEmail = async (email, redirectTo) => {
  if (credentialsMissing) return notConfigured();
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectTo || buildAuthRedirectUrl('/reset-password'),
  });
};

export const signOut = async () => {
  if (credentialsMissing) return notConfigured();
  return await supabase.auth.signOut();
};

// ── OAuth ────────────────────────────────────────────────────────────────────

export const signInWithGoogle = async (redirectTo = buildAuthRedirectUrl('/')) => {
  if (credentialsMissing) return notConfigured();
  return await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
};

export const signInWithFacebook = async (redirectTo = buildAuthRedirectUrl('/')) => {
  if (credentialsMissing) return notConfigured();
  return await supabase.auth.signInWithOAuth({ provider: 'facebook', options: { redirectTo } });
};

// ── Session ──────────────────────────────────────────────────────────────────

export const getSession = async () => {
  if (credentialsMissing) return { session: null, error: null };
  const { data, error } = await supabase.auth.getSession();
  return { session: data?.session ?? null, error };
};

export const getCurrentUser = async () => {
  if (credentialsMissing) return { user: null, error: null };
  const { data, error } = await supabase.auth.getUser();
  return { user: data?.user ?? null, error };
};

export const onAuthStateChange = (callback) => {
  if (credentialsMissing) {
    callback('INITIAL_SESSION', null);
    return () => {};
  }
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return () => subscription.unsubscribe();
};

export const updateProfile = async (metadata) => {
  if (credentialsMissing) return notConfigured();
  return await supabase.auth.updateUser({ data: metadata });
};

// ── Security: Password ────────────────────────────────────────────────────────

/**
 * Set / change the current user's password.
 * Uses the existing Supabase Auth session — no separate auth system.
 * Also flags `has_password` in user_metadata so the UI can show
 * "Set Password" vs "Change Password" (the password itself is stored
 * only by Supabase Auth, never in metadata or any table).
 */
export const updatePassword = async (newPassword) => {
  if (credentialsMissing) return notConfigured();
  return await supabase.auth.updateUser({
    password: newPassword,
    data: { has_password: true },
  });
};

// ── Security: Two-Factor Authentication (TOTP via Supabase MFA) ────────────────

/**
 * List the current user's MFA factors. A verified 'totp' factor means 2FA is on.
 */
export const listMfaFactors = async () => {
  if (credentialsMissing) return { data: null, error: notConfigured().error };
  return await supabase.auth.mfa.listFactors();
};

/**
 * Begin TOTP enrollment. Returns a QR code + secret to display to the user.
 */
export const enrollTotpFactor = async () => {
  if (credentialsMissing) return notConfigured();
  return await supabase.auth.mfa.enroll({ factorType: 'totp' });
};

/**
 * Verify the 6-digit code from the authenticator app to finish enrollment.
 */
export const verifyTotpFactor = async (factorId, code) => {
  if (credentialsMissing) return notConfigured();
  const { data: challenge, error: challengeError } =
    await supabase.auth.mfa.challenge({ factorId });
  if (challengeError) return { data: null, error: challengeError };
  return await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code,
  });
};

/**
 * Remove an MFA factor (disable 2FA).
 */
export const unenrollFactor = async (factorId) => {
  if (credentialsMissing) return notConfigured();
  return await supabase.auth.mfa.unenroll({ factorId });
};

// ── Account: Global sign-out & deletion ───────────────────────────────────────

/**
 * Sign out of every device/session for this user.
 */
export const signOutAllDevices = async () => {
  if (credentialsMissing) return notConfigured();
  return await supabase.auth.signOut({ scope: 'global' });
};

/**
 * Permanently delete the current user's account.
 * Account deletion requires the service-role key, so it is performed by the
 * backend which verifies the user's JWT before calling admin.deleteUser().
 */
export const deleteAccount = async () => {
  if (credentialsMissing) return { error: notConfigured().error };
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) return { error: { message: 'Not authenticated' } };

  try {
    const res = await fetch('/api/account', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: { message: body.message || 'Failed to delete account' } };
    }
    return { error: null };
  } catch (err) {
    return { error: { message: err.message || 'Failed to delete account' } };
  }
};

/**
 * Sync editable fields onto the caller's row in the Profiles table
 * (used by the admin dashboard). auth.updateUser() only touches
 * user_metadata, NOT the Profiles table, so this keeps them in sync.
 * Requires the service-role key server-side — done via the backend.
 * Accepts any subset of: fullName, phone, avatarUrl, dateOfBirth,
 * preferredLanguage, customLanguage, dietaryPreference, foodAllergies,
 * spicePreference, promotionalOffers, newProductNotifications,
 * emailNotifications, smsNotifications, whatsappNotifications.
 */
export const syncProfileRow = async (fields) => {
  if (credentialsMissing) return { error: notConfigured().error };
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) return { error: { message: 'Not authenticated' } };

  try {
    const res = await fetch('/api/account/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(fields),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: { message: body.message || 'Failed to sync profile' } };
    }
    return { error: null };
  } catch (err) {
    return { error: { message: err.message || 'Failed to sync profile' } };
  }
};

export const uploadProfileImage = async (userId, file) => {
  if (credentialsMissing) return notConfigured();
  const fileExt = file.name.split('.').pop();
  const filePath = `${userId}/profile.${fileExt}`;
  const { data, error } = await supabase.storage
    .from('profile-images')
    .upload(filePath, file, { upsert: true });

  if (error) return { data: null, error };
  const { data: urlData } = supabase.storage.from('profile-images').getPublicUrl(filePath);
  return { data: { publicUrl: urlData.publicUrl + `?t=${Date.now()}` }, error: null };
};
