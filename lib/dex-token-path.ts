/**
 * On-site DexScreener token routes use the **token mint / contract** address
 * (`baseToken.address`), not the pair address. List rows store both; links
 * always use `contractAddress`. The token page resolver still accepts a pair
 * address as a fallback via DexScreener `/latest/dex/pairs/{chain}/{pair}`.
 */

/** Map common aliases → DexScreener `chainId` values used in `/tokens/v1`. */
const DEX_CHAIN_CANONICAL: Record<string, string> = {
  eth: "ethereum",
  ethereum: "ethereum",
  sol: "solana",
  solana: "solana",
  bnb: "bsc",
  bsc: "bsc",
  binance: "bsc",
  "binance-smart-chain": "bsc",
  base: "base",
  arb: "arbitrum",
  arbitrum: "arbitrum",
  matic: "polygon",
  polygon: "polygon",
  avax: "avalanche",
  avalanche: "avalanche",
  op: "optimism",
  optimism: "optimism",
  ftm: "fantom",
  fantom: "fantom",
  cro: "cronos",
  cronos: "cronos",
  blast: "blast",
  linea: "linea",
  scroll: "scroll",
  zksync: "zksync",
  mantle: "mantle",
  pulsechain: "pulsechain",
  sui: "sui",
  hyperevm: "hyperevm",
  hyperliquid: "hyperliquid",
  injective: "injective",
  inj: "injective",
};

/** Aliases to try when a chain-specific DexScreener call returns empty. */
const DEX_CHAIN_LOOKUP_ALIASES: Record<string, string[]> = {
  ethereum: ["ethereum", "eth"],
  solana: ["solana", "sol"],
  bsc: ["bsc", "bnb", "binance-smart-chain"],
  polygon: ["polygon", "matic"],
  avalanche: ["avalanche", "avax"],
  arbitrum: ["arbitrum", "arb"],
  optimism: ["optimism", "op"],
  fantom: ["fantom", "ftm"],
  cronos: ["cronos", "cro"],
};

/** Normalize to DexScreener canonical chainId when known; otherwise lowercase input. */
export function normalizeDexChainId(chain: string | undefined): string | null {
  const key = chain?.trim().toLowerCase() ?? "";
  if (!/^[a-z0-9-]{1,32}$/.test(key)) return null;
  return DEX_CHAIN_CANONICAL[key] ?? key;
}

/** Chain ids to try against DexScreener APIs for a route/list chain param. */
export function dexChainLookupCandidates(chain: string | undefined): string[] {
  const canonical = normalizeDexChainId(chain);
  if (!canonical) return [];
  const aliases = DEX_CHAIN_LOOKUP_ALIASES[canonical] ?? [canonical];
  const raw = chain?.trim().toLowerCase() ?? "";
  const out: string[] = [];
  for (const id of [canonical, ...aliases, raw]) {
    if (id && /^[a-z0-9-]{1,32}$/.test(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function sameDexChain(a: string | undefined, b: string | undefined): boolean {
  const ca = normalizeDexChainId(a);
  const cb = normalizeDexChainId(b);
  if (!ca || !cb) return false;
  return ca === cb;
}

/** On-site DexScreener token page path. Safe to import from client components. */
export function dexTokenPath(
  chain: string | undefined,
  address: string | undefined,
): string | null {
  const chainId = normalizeDexChainId(chain);
  const token = address?.trim() ?? "";
  if (!chainId) return null;
  if (!isTokenAddress(token)) return null;
  return `/token/${encodeURIComponent(chainId)}/${encodeURIComponent(token)}`;
}

export function isTokenAddress(value: string): boolean {
  const v = value.trim();
  // EVM contract / pair (40 hex is standard; allow shorter test ids)
  if (/^0x[a-fA-F0-9]{8,80}$/.test(v)) return true;
  // Solana / base58 mints (incl. pump.fun suffixes)
  if (/^[1-9A-HJ-NP-Za-km-z]{32,64}$/.test(v)) return true;
  return false;
}

export function sanitizeChainParam(raw: string): string | null {
  return normalizeDexChainId(raw);
}

export function sanitizeAddressParam(raw: string): string | null {
  const v = raw.trim();
  return isTokenAddress(v) ? v : null;
}

export function sameTokenAddress(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}
