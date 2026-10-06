// CORS_ORIGIN may be a single origin or a comma-separated list — the
// customer-facing frontend and the admin frontend are two separate deployed
// origins that both call this backend, so a single hardcoded value would
// lock one of them out. '*' (default) allows both without an allow-list.
const rawCorsOrigin = process.env.CORS_ORIGIN || '*';
const corsOrigin = rawCorsOrigin === '*'
  ? '*'
  : rawCorsOrigin.split(',').map((origin) => origin.trim()).filter(Boolean);

const env = process.env.NODE_ENV || 'development';

// Guard against shipping a wildcard CORS policy to production. This does NOT
// change behaviour (so a deploy that hasn't set CORS_ORIGIN yet keeps working)
// — it surfaces a loud warning so the allow-list is configured before launch.
if (env === 'production' && corsOrigin === '*') {
  console.warn(
    '[SECURITY] CORS_ORIGIN is not set in production — the API currently accepts ' +
    'requests from ANY origin. Set CORS_ORIGIN to the exact frontend + admin ' +
    'origins (comma-separated) before public launch.'
  );
}

export const config = {
  port: process.env.PORT || 5000,
  env,
  apiPrefix: '/api',
  corsOrigin
};
