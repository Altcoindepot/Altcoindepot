/**
 * Shared DexScreener ↔ CoinGecko platform id maps.
 * Live price must never come from Gecko — these maps only wire contracts.
 */

import { normalizeDexChainId } from "@/lib/dex-token-path";

/** DexScreener chainId → CoinGecko asset_platform id. */
export const DEX_CHAIN_TO_GECKO_PLATFORM: Record<string, string> = {
  ethereum: "ethereum",
  solana: "solana",
  base: "base",
  bsc: "binance-smart-chain",
  arbitrum: "arbitrum-one",
  polygon: "polygon-pos",
  optimism: "optimistic-ethereum",
  avalanche: "avalanche",
  fantom: "fantom",
  cronos: "cronos",
  zksync: "zksync",
  linea: "linea",
  scroll: "scroll",
  mantle: "mantle",
  blast: "blast",
};

/** Prefer these Dex chains when a coin has multiple contracts. */
export const PREFERRED_DEX_CHAINS = [
  "ethereum",
  "solana",
  "bsc",
  "base",
  "arbitrum",
  "polygon",
  "avalanche",
  "optimism",
] as const;

const GECKO_PLATFORM_TO_DEX: Record<string, string> = Object.fromEntries(
  Object.entries(DEX_CHAIN_TO_GECKO_PLATFORM).map(([dex, gecko]) => [gecko, dex]),
);

export function geckoPlatformIdForDexChain(chain: string | undefined): string | null {
  const dex = normalizeDexChainId(chain);
  if (!dex) return null;
  return DEX_CHAIN_TO_GECKO_PLATFORM[dex] ?? null;
}

export function dexChainFromGeckoPlatform(platform: string | undefined): string | null {
  const key = platform?.trim().toLowerCase() ?? "";
  if (!key) return null;
  return GECKO_PLATFORM_TO_DEX[key] ?? normalizeDexChainId(key);
}

export type CoinPlatformContract = {
  chain: string;
  address: string;
  geckoPlatform: string;
};

/** Parse Gecko platforms map into Dex-routable contracts. */
export function parseGeckoPlatforms(
  platforms: Record<string, string | null | undefined> | null | undefined,
): CoinPlatformContract[] {
  if (!platforms || typeof platforms !== "object") return [];
  const out: CoinPlatformContract[] = [];
  for (const [geckoPlatform, raw] of Object.entries(platforms)) {
    const address = typeof raw === "string" ? raw.trim() : "";
    if (!address || address === "0x0000000000000000000000000000000000000000") continue;
    const chain = dexChainFromGeckoPlatform(geckoPlatform);
    if (!chain) continue;
    out.push({ chain, address, geckoPlatform: geckoPlatform.trim().toLowerCase() });
  }
  out.sort((a, b) => {
    const ia = PREFERRED_DEX_CHAINS.indexOf(a.chain as (typeof PREFERRED_DEX_CHAINS)[number]);
    const ib = PREFERRED_DEX_CHAINS.indexOf(b.chain as (typeof PREFERRED_DEX_CHAINS)[number]);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
  return out;
}
