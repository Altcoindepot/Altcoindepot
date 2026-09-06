/**
 * Data-driven SEO for `/token/[chain]/[address]`.
 * Multi-intent via buildAssetSeoCopy — no “best crypto to buy” fluff.
 */

import { buildAssetSeoCopy, type AssetSeoCopy } from "@/lib/asset-seo";

export type TokenSeoCopy = AssetSeoCopy;

export function buildTokenSeoCopy(input: {
  name: string;
  symbol: string;
  chainLabel: string;
  chainId?: string;
  contractAddress?: string | null;
  /** True when CoinGecko fundamentals resolved for this contract. */
  listedOnGecko: boolean;
}): TokenSeoCopy {
  return buildAssetSeoCopy({
    name: input.name,
    symbol: input.symbol,
    variationKey: `${input.chainId ?? input.chainLabel}:${input.contractAddress ?? input.symbol}`,
    chainLabel: input.chainLabel,
    contractAddress: input.contractAddress,
    listedOnGecko: input.listedOnGecko,
  });
}
