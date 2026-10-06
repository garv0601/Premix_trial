/**
 * ANNAPURNA Backend — Security middleware (zero external dependencies)
 *
 * Provides:
 *   1. securityHeaders — conservative HTTP response hardening headers.
 *   2. createRateLimiter — a lightweight in-memory fixed-window rate limiter
 *      for abuse protection on sensitive endpoints.
 *
 * Notes:
 *   - No Content-Security-Policy is set here: this process serves JSON API
 *     responses only (never HTML), so a CSP would add no XSS protection while
 *     risking breakage. The customer/admin frontends set their own headers at
 *     their static host.
 *   - The rate limiter uses per-process memory. It is sufficient for a single
 *     backend instance. If the API is ever horizontally scaled, move to a
 *     shared store (e.g. Redis) so limits are enforced across instances.
 */

const isProduction = (process.env.NODE_ENV || 'development') === 'production';

/**
 * Sets a small, safe set of security response headers on every request.
 * These do not alter response bodies or existing functionality.
 */
export function securityHeaders(req, res, next) {
  // Stop browsers from MIME-sniffing a response away from the declared type.
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Clickjacking protection — the API is not meant to be framed.
  res.setHeader('X-Frame-Options', 'DENY');
  // Don't leak full URLs (with query strings) to third parties.
  res.setHeader('Referrer-Policy', 'no-referrer');
  // Disable powerful browser features by default for API responses.
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  // Only advertise HSTS in production (never force HTTPS on local http dev).
  if (isProduction) {
    res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  }
  next();
}

/**
 * Create an in-memory fixed-window rate limiter.
 *
 * @param {object}  options
 * @param {number}  options.windowMs  Window length in milliseconds.
 * @param {number}  options.max       Max requests per key per window.
 * @param {string} [options.message]  Message returned on limit exceeded.
 * @returns {import('express').RequestHandler}
 */
export function createRateLimiter({ windowMs, max, message = 'Too many requests. Please try again later.' }) {
  /** @type {Map<string, { count: number, resetAt: number }>} */
  const hits = new Map();

  // Periodically drop expired buckets so the map can't grow unbounded.
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key);
    }
  }, windowMs);
  // Don't keep the event loop alive just for the sweeper.
  if (typeof sweep.unref === 'function') sweep.unref();

  return function rateLimiter(req, res, next) {
    // Prefer the real client IP behind a proxy (Render/Vercel set this header).
    const forwarded = req.headers['x-forwarded-for'];
    const ip = (typeof forwarded === 'string' && forwarded.split(',')[0].trim())
      || req.ip
      || req.socket?.remoteAddress
      || 'unknown';
    const key = `${req.method}:${req.baseUrl}${req.path}:${ip}`;

    const now = Date.now();
    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;

    const remaining = Math.max(0, max - entry.count);
    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(remaining));

    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({ success: false, message });
    }
    next();
  };
}
