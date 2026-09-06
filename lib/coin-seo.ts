/**
 * Programmatic SEO for `/coin/[id]`.
 * Absolute titles (no double site suffix). Multi-intent via buildAssetSeoCopy.
 */

import { buildAssetSeoCopy, seoChainLabel, type AssetSeoCopy } from "@/lib/asset-seo";

export type CoinSeoCopy = AssetSeoCopy;

export type CoinSeoExtras = {
  narrative?: string | null;
  tags?: string[];
  vsBtc7d?: number | null;
  hasDexPair?: boolean;
  listedOnGecko?: boolean;
  chain?: string | null;
  contractAddress?: string | null;
};

const BASELINE: CoinSeoCopy = {
  title: "Narrative rotation + live Dex movers | AltCoin Depot",
  description:
    "Track narrative rotation and live Dex movers on AltCoin Depot. Informational only — not financial advice.",
  h1: "Live crypto markets",
};

export function buildCoinSeoCopy(
  name: string,
  symbol: string,
  coinId?: string,
  extras?: CoinSeoExtras,
): CoinSeoCopy {
  try {
    const listedOnGecko = extras?.listedOnGecko ?? true;
    const chainLabel = extras?.chain
      ? seoChainLabel(extras.chain)
      : listedOnGecko
        ? "major chains"
        : "DEX";
    return buildAssetSeoCopy({
      name,
      symbol,
      coinId,
      variationKey: coinId ?? `${name}-${symbol}`,
      chainLabel,
      contractAddress: extras?.contractAddress,
      listedOnGecko,
    });
  } catch {
    return BASELINE;
  }
}

export function getBaselineCoinSeoCopy(): CoinSeoCopy {
  return BASELINE;
}
