/**
 * News-page ticker chips — match title → /token/[chain]/[address].
 * Dex-only paths; no CoinGecko. Majors use USDT-first preferred venues.
 */

import { dexTokenPath } from "@/lib/dex-token-path";

export type NewsTickerChip = {
  symbol: string;
  href: string;
};

type CoreTicker = {
  symbol: string;
  /** Word-boundary aliases (ticker + names). Case-insensitive. */
  aliases: string[];
  chain: string;
  address: string;
};

/**
 * Core majors with known Dex contracts (USDT-first venues where available).
 * One pill per distinct asset; aliases fold into the same symbol.
 */
const CORE_TICKERS: CoreTicker[] = [
  {
    symbol: "BTC",
    aliases: ["btc", "bitcoin"],
    chain: "ethereum",
    address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
  },
  {
    symbol: "ETH",
    aliases: ["eth", "ethereum", "ether"],
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
    // BSC INJ/USDT — ethereum INJ has no liquid USDT pool.
    chain: "bsc",
    address: "0xa2B726B1145A4773F68593CF171187d8EBe4d495",
  },
  {
    symbol: "BNB",
    aliases: ["bnb", "bnb chain", "binance coin", "binancecoin"],
    chain: "bsc",
    address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  },
  {
    symbol: "XRP",
    aliases: ["xrp", "ripple"],
    chain: "bsc",
    address: "0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE",
  },
  {
    symbol: "DOGE",
    aliases: ["doge", "dogecoin"],
    chain: "bsc",
    address: "0xbA2aE424d960c26247Dd6c32edC70B295c744C43",
  },
  {
    symbol: "ADA",
    aliases: ["ada", "cardano"],
    chain: "bsc",
    address: "0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47",
  },
  {
    symbol: "AVAX",
    aliases: ["avax", "avalanche"],
    chain: "avalanche",
    address: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
  },
  {
    symbol: "LINK",
    aliases: ["link", "chainlink"],
    chain: "ethereum",
    address: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
  },
  {
    symbol: "SUI",
    aliases: ["sui"],
    chain: "sui",
    address: "0x2::sui::SUI",
  },
  {
    symbol: "TON",
    aliases: ["ton", "toncoin", "the open network"],
    // Bridged TONCOIN on BSC has liquid USDT.
    chain: "bsc",
    address: "0x76a797a59ba2c17726896976b7b3747bfd1d220f",
  },
  {
    symbol: "DOT",
    aliases: ["dot", "polkadot"],
    chain: "bsc",
    address: "0x7083609fCE4d1d8Dc0C979AAb8c869Ea2C873402",
  },
  {
    symbol: "LTC",
    aliases: ["ltc", "litecoin"],
    chain: "bsc",
    address: "0x4338665CBB7B2485A8855A139b75D5e34AB0DB94",
  },
  {
    symbol: "ARB",
    aliases: ["arb", "arbitrum"],
    chain: "arbitrum",
    address: "0x912CE59144191C1204E64559FE8253a0e49E6548",
  },
  {
    symbol: "OP",
    aliases: ["op", "optimism"],
    chain: "optimism",
    address: "0x4200000000000000000000000000000000000042",
  },
  {
    symbol: "PEPE",
    aliases: ["pepe"],
    chain: "ethereum",
    address: "0x6982508145454ce325ddbe47a25d4ec3d2311933",
  },
  {
    symbol: "BONK",
    aliases: ["bonk"],
    chain: "solana",
    address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
  },
  {
    symbol: "WIF",
    aliases: ["wif", "dogwifhat", "dog wif hat"],
    chain: "solana",
    address: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
  },
  {
    symbol: "USDC",
    aliases: ["usdc", "usd coin"],
    chain: "ethereum",
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  },
  {
    symbol: "USDT",
    aliases: ["usdt", "tether", "tether usd"],
    chain: "ethereum",
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  },
];

/**
 * Common English words that collide with tickers — never chip from listed Dex
 * unless the title also matches a longer unambiguous form (not used here).
 */
const AMBIGUOUS_TICKERS = new Set([
  "AI",
  "GAS",
  "NOW",
  "ON",
  "AT",
  "BE",
  "OR",
  "IF",
  "TO",
  "UP",
  "IN",
  "OUT",
  "ALL",
  "NEW",
  "OLD",
  "TOP",
  "LOW",
  "DAY",
  "CAN",
  "MAY",
  "ONE",
  "TWO",
  "FOR",
  "AND",
  "THE",
  "YOU",
  "ARE",
  "HAS",
  "HAD",
  "WAS",
  "NOT",
  "BUT",
  "ANY",
  "OWN",
  "FUN",
  "KEY",
  "ACE",
  "OPEN",
  "REAL",
  "FAST",
  "SAFE",
  "TRUE",
  "JUST",
  "NEXT",
  "NEAR",
  "CORE",
  "EDGE",
  "FLOW",
  "TIME",
  "HIGH",
  "LONG",
  "SHORT",
  "SMART",
]);

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
 * Chips for a headline. Core majors first (ticker + name), then high-volume
 * listed Dex movers/low-caps when the ticker appears as a whole word.
 * Empty array when nothing matches. One pill per distinct asset.
 */
export function matchNewsTickerChips(
  title: string,
  listed: NewsTickerCandidate[] = [],
  limit = 12,
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
    if (AMBIGUOUS_TICKERS.has(sym)) continue;
    if (!titleHasAlias(t, sym)) continue;
    push(sym, row.chain, row.address);
  }

  return out;
}
