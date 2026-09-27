/**
 * News-page ticker chips — match title → /token/[chain]/[address].
 * Dex-only paths; no CoinGecko.
 */

import { dexTokenPath } from "@/lib/dex-token-path";

export type NewsTickerChip = {
  symbol: string;
  href: string;
};

/** Core majors with known Dex contracts (word-boundary match on ticker or name). */
const CORE_TICKERS: Array<{
  symbol: string;
  aliases: string[];
  chain: string;
  address: string;
}> = [
  {
    symbol: "BTC",
    aliases: ["btc", "bitcoin"],
    chain: "ethereum",
    address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
  },
  {
    symbol: "ETH",
    aliases: ["eth", "ethereum"],
    chain: "ethereum",
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  },
  {
    symbol: "SOL",
    aliases: ["sol", "solana"],
    chain: "solana",
    address: "So11111111111111111111111111111111111111112",
  },
  {
    symbol: "INJ",
    aliases: ["inj", "injective"],
    chain: "ethereum",
    address: "0xe28b3B32B6c345A34Ff64674606124Dd5Aceca30",
  },
];

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function titleHasAlias(title: string, alias: string): boolean {
  const a = alias.trim();
  if (!a) return false;
  // Word boundary; multi-word aliases use spaced edges.
  const pattern =
    a.includes(" ")
      ? new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(a)}(?:[^a-z0-9]|$)`, "i")
      : new RegExp(`\\b${escapeRegExp(a)}\\b`, "i");
  return pattern.test(title);
}

export type NewsTickerCandidate = {
  symbol: string;
  chain: string;
  address: string;
};

/**
 * Chips for a headline. Core BTC/ETH/SOL/INJ first, then high-volume listed
 * candidates (e.g. Dex movers) when the ticker appears as a whole word.
 */
export function matchNewsTickerChips(
  title: string,
  listed: NewsTickerCandidate[] = [],
  limit = 3,
): NewsTickerChip[] {
  const t = title.trim();
  if (!t) return [];
  const out: NewsTickerChip[] = [];
  const seen = new Set<string>();

  const push = (symbol: string, chain: string, address: string) => {
    if (out.length >= limit) return;
    const sym = symbol.trim().toUpperCase();
    if (!sym || seen.has(sym)) return;
    const href = dexTokenPath(chain, address);
    if (!href) return;
    seen.add(sym);
    out.push({ symbol: sym, href });
  };

  for (const core of CORE_TICKERS) {
    if (core.aliases.some((a) => titleHasAlias(t, a))) {
      push(core.symbol, core.chain, core.address);
    }
  }

  for (const row of listed) {
    const sym = row.symbol.trim().toUpperCase();
    if (!sym || sym.length < 2) continue;
    if (seen.has(sym)) continue;
    if (!titleHasAlias(t, sym)) continue;
    push(sym, row.chain, row.address);
  }

  return out;
}
