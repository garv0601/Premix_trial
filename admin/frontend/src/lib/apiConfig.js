/**
 * Central admin backend API base URL.
 *
 * ALL admin services (orders, dashboard, customers, etc.) must import
 * `API_BASE_URL` from here instead of each computing their own fallback.
 *
 * Resolution order:
 *   1. `VITE_BACKEND_URL` — set via `.env` locally (e.g.
 *      http://localhost:5000/api, forwarded by the Vite dev proxy in
 *      vite.config.js) or via the hosting provider's build-time env vars.
 *   2. The deployed backend's public URL as a hardcoded fallback.
 *
 * IMPORTANT: the fallback must be the backend's own absolute URL, NEVER a
 * same-origin relative path like '/api' and NEVER `window.location.origin`.
 * The admin frontend and backend are deployed as separate services — a
 * relative fallback silently resolves to the frontend's own domain
 * (e.g. https://admin-eu2q.onrender.com/api) instead of the backend
 * (https://premix-trial.onrender.com/api) whenever the env var isn't set
 * at build time.
 */
export const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL || 'https://premix-trial.onrender.com/api';
