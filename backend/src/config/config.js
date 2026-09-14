// CORS_ORIGIN may be a single origin or a comma-separated list — the
// customer-facing frontend and the admin frontend are two separate deployed
// origins that both call this backend, so a single hardcoded value would
// lock one of them out. '*' (default) allows both without an allow-list.
const rawCorsOrigin = process.env.CORS_ORIGIN || '*';
const corsOrigin = rawCorsOrigin === '*'
  ? '*'
  : rawCorsOrigin.split(',').map((origin) => origin.trim()).filter(Boolean);

export const config = {
  port: process.env.PORT || 5000,
  env: process.env.NODE_ENV || 'development',
  apiPrefix: '/api',
  corsOrigin
};
