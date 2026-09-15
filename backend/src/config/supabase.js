/**
 * ANNAPURNA Backend — Supabase Admin Client
 *
 * Uses the SERVICE-ROLE key which bypasses RLS.
 * This module MUST only run server-side.
 * NEVER expose SUPABASE_SERVICE_ROLE_KEY in any frontend code.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl      = process.env.SUPABASE_URL;
const serviceRoleKey   = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.warn(
    '[Supabase Backend] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set.\n' +
    'Order creation and admin operations will fail until these are configured in the backend .env'
  );
}

/**
 * Admin (service-role) Supabase client.
 * Bypasses RLS — use ONLY for server-side privileged operations.
 */
export const supabaseAdmin = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

/**
 * Helper: verify a user JWT from the frontend request and return the
 * authenticated user (WITHOUT trusting any user-supplied ID).
 *
 * @param {string} jwt  The Authorization Bearer token from the request header
 * @returns {Promise<object>}  The verified Supabase user object
 * @throws  If the token is invalid or missing
 */
export async function verifyUser(jwt) {
  if (!supabaseAdmin) throw new Error('Supabase backend client not initialised');
  const { data, error } = await supabaseAdmin.auth.getUser(jwt);
  if (error || !data?.user) {
    // Log the real Supabase error server-side only (never sent to the client)
    // so a rejected token — expired vs. malformed vs. issued by a different
    // Supabase project than this backend's SUPABASE_URL/SERVICE_ROLE_KEY —
    // is diagnosable from server logs instead of a single generic message.
    console.error('[verifyUser] Token rejected by Supabase:', error?.message || 'no user returned for token');
    throw new Error('Invalid or expired authentication token');
  }
  return data.user;
}
