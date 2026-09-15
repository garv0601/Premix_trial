/**
 * ANNAPURNA Backend — Trend Helper
 *
 * Computes a "vs. previous period" percentage + direction used by dashboard
 * KPI cards (Total Sales, Total Orders, New Customers). Shared so every
 * trend badge in the admin app uses identical rounding/zero-handling rules.
 */

export function computeTrend(current, previous) {
  const curr = Number(current) || 0;
  const prev = Number(previous) || 0;

  if (prev === 0) {
    return { percent: curr > 0 ? 100 : 0, direction: curr > 0 ? 'up' : 'steady' };
  }

  const diffPercent = ((curr - prev) / prev) * 100;
  const direction = curr > prev ? 'up' : curr < prev ? 'down' : 'steady';
  return { percent: Math.abs(Math.round(diffPercent)), direction };
}
