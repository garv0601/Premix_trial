/**
 * ANNAPURNA — Supabase Client
 *
 * Reads VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from the
 * environment (set in .env or .env.local).
 *
 * Returns null gracefully if credentials are missing so the app
 * continues to render during development without crashing.
 *
 * IMPORTANT: Only use the public anon key here.
 * The service-role secret must NEVER appear in frontend code.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ── Credential check ─────────────────────────────────────────────────────────
const credentialsMissing = !supabaseUrl || !supabaseKey;

if (credentialsMissing) {
  // Developer-only warning — never shown to end users.
  console.warn(
    '[Supabase] Credentials are not configured.\n' +
    'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env.local file\n' +
    'to enable authentication. Restart the dev server after editing .env files.'
  );
}

// ── Client ───────────────────────────────────────────────────────────────────
/**
 * The Supabase client instance, or null if credentials are missing.
 * Always guard usage: `if (supabase) { ... }`
 */
const supabase = credentialsMissing
  ? null
  : createClient(supabaseUrl, supabaseKey, {
      auth: {
        // Persist session across refreshes using localStorage
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });

export default supabase;
export { credentialsMissing };
