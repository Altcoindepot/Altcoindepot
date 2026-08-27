/**
 * Programmatic SEO for `/coin/[id]` — Dex live + Gecko static stats angle.
 * Absolute titles (no double site suffix).
 */

export type CoinSeoCopy = {
  title: string;
  description: string;
};

export type CoinSeoExtras = {
  narrative?: string | null;
  tags?: string[];
  vsBtc7d?: number | null;
  /** When false, use Dex-only / not-on-CG framing (rare for gecko id routes). */
  hasDexPair?: boolean;
};

const BASELINE: CoinSeoCopy = {
  title: "Narrative rotation + live Dex movers | AltCoin Depot",
  description:
    "Track narrative rotation and live Dex movers on AltCoin Depot. Informational only — not financial advice.",
};

function clampLen(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Listed majors: Dex price + contract + ATH/supply framing (not CMC clone).
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

    const title = `${ticker} Dex Price, Contract, ATH & Supply | AltCoin Depot`;
    const description = `Live Dex price/chart for ${coinName}. Contract, liquidity, volume. CoinGecko ATH/ATL/supply when listed. Informational only — not financial advice.`;

    return {
      title: title.length > 70 ? clampLen(title, 70) : title,
      description: description.length > 165 ? clampLen(description, 165) : description,
    };
  } catch {
    return BASELINE;
  }
}

export function getBaselineCoinSeoCopy(): CoinSeoCopy {
  return BASELINE;
}
