/**
 * Common wrong / shorthand URLs → canonical CoinGecko ids.
 * Keep in sync with redirects in next.config.ts where possible.
 */
export const COIN_ID_ALIASES: Record<string, string> = {
  injective: "injective-protocol",
  bnb: "binancecoin",
  xrp: "ripple",
  avax: "avalanche-2",
  ada: "cardano",
  doge: "dogecoin",
  shib: "shiba-inu",
  link: "chainlink",
  uni: "uniswap",
  ltc: "litecoin",
  bch: "bitcoin-cash",
  xlm: "stellar",
  trx: "tron",
  hbar: "hedera-hashgraph",
  dot: "polkadot",
  atom: "cosmos",
  matic: "matic-network",
  polygon: "polygon-ecosystem-token",
  wif: "dogwifcoin",
};

/** Normalize a path segment and resolve known aliases to the canonical CoinGecko id. */
export function resolveCoinIdAlias(rawId: string): string {
  const safe = rawId.trim().toLowerCase();
  return COIN_ID_ALIASES[safe] ?? safe;
}
