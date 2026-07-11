/**
 * Compact USD for display. Avoids `Intl` compact currency — Node and browsers
 * can format differently (e.g. $1.70B vs $1.7B), which breaks client hydration.
 */
export function formatCompactUsd(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  const sign = n < 0 ? "-" : "";
  const v = Math.abs(n);
  if (v >= 1e12) return `${sign}$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `${sign}$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${sign}$${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${sign}$${(v / 1e3).toFixed(2)}K`;
  return `${sign}$${v.toFixed(2)}`;
}
