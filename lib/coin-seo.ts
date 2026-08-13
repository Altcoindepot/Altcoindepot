/**
 * Programmatic SEO for individual coin pages (`/coin/[id]`).
 * Titles use absolute strings so the root layout template does not
 * append a second `| AltCoin Depot` / `· AltCoin Depot` suffix.
 */
export type CoinSeoCopy = {
  title: string;
  description: string;
};

export type CoinSeoExtras = {
  /** Primary narrative / category label (e.g. AI, DeFi, Layer 1). */
  narrative?: string | null;
  /** @deprecated Prefer `narrative`; kept for older callers. */
  tags?: string[];
  /** Unused in the primary CTR template; retained for compatibility. */
  vsBtc7d?: number | null;
};

const BASELINE: CoinSeoCopy = {
  title: "Live Crypto Data, Volume & Narrative | AltCoin Depot",
  description:
    "Track real-time volume, capital rotation signals, and market regime data on AltCoin Depot. View live narrative flow maps instantly.",
};

function clampLen(text: string, max: number): string {
  if (text.length <= max) return text;
  const trimmed = text.slice(0, max - 1).trimEnd();
  return `${trimmed}…`;
}

/**
 * High-CTR metadata for coin sub-pages.
 * Safe defaults when name / ticker / narrative are missing.
 */
export function buildCoinSeoCopy(
  name: string,
  symbol: string,
  _coinId?: string,
  extras?: CoinSeoExtras,
): CoinSeoCopy {
  try {
    const coinName = (name ?? "").toString().trim() || "Crypto Asset";
    const ticker = (symbol ?? "").toString().trim().toUpperCase() || "TOKEN";
    const narrative =
      (extras?.narrative ?? "").toString().trim() ||
      (extras?.tags && extras.tags.length > 0 ? extras.tags[0]!.trim() : "") ||
      "crypto";

    const title = `${coinName} (${ticker}) Live Data, Volume & Narrative | AltCoin Depot`;
    const description = `Track real-time volume, capital rotation signals, and market regime data for ${coinName} (${ticker}). View the live ${narrative} flow map instantly.`;

    return {
      // Soft caps only for pathological names — keep the CTR template intact for normal coins.
      title: title.length > 90 ? clampLen(title, 90) : title,
      description: description.length > 180 ? clampLen(description, 180) : description,
    };
  } catch {
    return BASELINE;
  }
}

export function getBaselineCoinSeoCopy(): CoinSeoCopy {
  return BASELINE;
}
