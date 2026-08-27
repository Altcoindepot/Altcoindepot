/**
 * Credible ~top-300 majors identity catalog.
 * Sources (official JSON only, no HTML scrape):
 *   1) Coinbase Exchange currencies + USD/USDT/USDC products
 *   2) Binance exchangeInfo TRADING USDT pairs (base assets)
 * Merged by canonical symbol. Cached 12h — never fetched per keystroke.
 * Live price/chart still Dex → GeckoTerminal.
 */

import { unstable_cache } from "next/cache";

export type MajorPreferredContract = {
  chain: string;
  address: string;
};

export type MajorCatalogEntry = {
  symbol: string;
  name: string;
  /** Lowercase aliases: ticker, name, gecko id, extra aliases */
  names: string[];
  /** CoinGecko id when known — drives /coin/[id] */
  geckoId: string | null;
  preferred?: MajorPreferredContract;
  sources: Array<"coinbase" | "binance">;
};

type SeedRow = {
  symbol: string;
  geckoId: string;
  names?: string[];
  preferred?: MajorPreferredContract;
};

/**
 * Stable gecko ids + Dex preferred contracts + extra name aliases.
 * Identity membership still comes from Coinbase+Binance; this only enriches.
 */
const SEED_BY_SYMBOL: Record<string, SeedRow> = {
  BTC: {
    symbol: "BTC",
    geckoId: "bitcoin",
    names: ["bitcoin"],
    preferred: {
      chain: "ethereum",
      address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    },
  },
  ETH: {
    symbol: "ETH",
    geckoId: "ethereum",
    names: ["ethereum", "ether"],
    preferred: {
      chain: "ethereum",
      address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    },
  },
  WBTC: {
    symbol: "WBTC",
    geckoId: "wrapped-bitcoin",
    names: ["wrapped bitcoin"],
    preferred: {
      chain: "ethereum",
      address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    },
  },
  WETH: {
    symbol: "WETH",
    geckoId: "weth",
    names: ["wrapped ether", "wrapped ethereum"],
    preferred: {
      chain: "ethereum",
      address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    },
  },
  USDT: { symbol: "USDT", geckoId: "tether", names: ["tether", "tether usd"] },
  USDC: { symbol: "USDC", geckoId: "usd-coin", names: ["usd coin"] },
  XRP: { symbol: "XRP", geckoId: "ripple", names: ["ripple"] },
  BNB: { symbol: "BNB", geckoId: "binancecoin", names: ["binance coin", "binancecoin"] },
  SOL: { symbol: "SOL", geckoId: "solana", names: ["solana"] },
  DOGE: { symbol: "DOGE", geckoId: "dogecoin", names: ["dogecoin"] },
  TRX: { symbol: "TRX", geckoId: "tron", names: ["tron"] },
  ADA: { symbol: "ADA", geckoId: "cardano", names: ["cardano"] },
  LINK: { symbol: "LINK", geckoId: "chainlink", names: ["chainlink"] },
  AVAX: { symbol: "AVAX", geckoId: "avalanche-2", names: ["avalanche"] },
  XLM: { symbol: "XLM", geckoId: "stellar", names: ["stellar", "stellar lumens"] },
  BCH: { symbol: "BCH", geckoId: "bitcoin-cash", names: ["bitcoin cash"] },
  HBAR: { symbol: "HBAR", geckoId: "hedera-hashgraph", names: ["hedera", "hedera hashgraph"] },
  SHIB: { symbol: "SHIB", geckoId: "shiba-inu", names: ["shiba inu"] },
  LTC: { symbol: "LTC", geckoId: "litecoin", names: ["litecoin"] },
  TON: { symbol: "TON", geckoId: "toncoin", names: ["toncoin", "the open network"] },
  DOT: { symbol: "DOT", geckoId: "polkadot", names: ["polkadot"] },
  UNI: { symbol: "UNI", geckoId: "uniswap", names: ["uniswap"] },
  PEPE: { symbol: "PEPE", geckoId: "pepe" },
  AAVE: { symbol: "AAVE", geckoId: "aave" },
  NEAR: { symbol: "NEAR", geckoId: "near", names: ["near protocol"] },
  ICP: { symbol: "ICP", geckoId: "internet-computer", names: ["internet computer"] },
  ETC: { symbol: "ETC", geckoId: "ethereum-classic", names: ["ethereum classic"] },
  RENDER: { symbol: "RENDER", geckoId: "render-token", names: ["render", "rndr", "render token"] },
  VET: { symbol: "VET", geckoId: "vechain", names: ["vechain"] },
  POL: { symbol: "POL", geckoId: "polygon-ecosystem-token", names: ["polygon", "matic"] },
  MATIC: { symbol: "MATIC", geckoId: "matic-network", names: ["polygon"] },
  FIL: { symbol: "FIL", geckoId: "filecoin", names: ["filecoin"] },
  APT: { symbol: "APT", geckoId: "aptos", names: ["aptos"] },
  ALGO: { symbol: "ALGO", geckoId: "algorand", names: ["algorand"] },
  ARB: { symbol: "ARB", geckoId: "arbitrum", names: ["arbitrum"] },
  ATOM: { symbol: "ATOM", geckoId: "cosmos", names: ["cosmos", "cosmos hub"] },
  MKR: { symbol: "MKR", geckoId: "maker", names: ["maker"] },
  INJ: {
    symbol: "INJ",
    geckoId: "injective-protocol",
    names: ["injective", "injective protocol"],
  },
  OP: { symbol: "OP", geckoId: "optimism", names: ["optimism"] },
  STX: { symbol: "STX", geckoId: "blockstack", names: ["stacks", "blockstack"] },
  IMX: { symbol: "IMX", geckoId: "immutable-x", names: ["immutable", "immutable x"] },
  GRT: { symbol: "GRT", geckoId: "the-graph", names: ["the graph"] },
  THETA: { symbol: "THETA", geckoId: "theta-token", names: ["theta", "theta network"] },
  BONK: { symbol: "BONK", geckoId: "bonk" },
  LDO: { symbol: "LDO", geckoId: "lido-dao", names: ["lido", "lido dao"] },
  XMR: { symbol: "XMR", geckoId: "monero", names: ["monero"] },
  SEI: { symbol: "SEI", geckoId: "sei-network", names: ["sei", "sei network"] },
  WLD: { symbol: "WLD", geckoId: "worldcoin-wld", names: ["worldcoin"] },
  FLOKI: { symbol: "FLOKI", geckoId: "floki" },
  JUP: { symbol: "JUP", geckoId: "jupiter-exchange-solana", names: ["jupiter"] },
  ONDO: { symbol: "ONDO", geckoId: "ondo-finance", names: ["ondo", "ondo finance"] },
  TAO: { symbol: "TAO", geckoId: "bittensor", names: ["bittensor"] },
  TIA: { symbol: "TIA", geckoId: "celestia", names: ["celestia"] },
  PYTH: { symbol: "PYTH", geckoId: "pyth-network", names: ["pyth", "pyth network"] },
  SUI: { symbol: "SUI", geckoId: "sui" },
  HYPE: { symbol: "HYPE", geckoId: "hyperliquid", names: ["hyperliquid"] },
  DAI: { symbol: "DAI", geckoId: "dai" },
  STETH: { symbol: "STETH", geckoId: "staked-ether", names: ["lido staked ether", "staked ether"] },
  CRO: { symbol: "CRO", geckoId: "crypto-com-chain", names: ["cronos", "crypto.com coin"] },
  FET: {
    symbol: "FET",
    geckoId: "fetch-ai",
    names: ["fetch.ai", "fetch ai", "artificial superintelligence alliance"],
  },
  KAS: { symbol: "KAS", geckoId: "kaspa", names: ["kaspa"] },
  MNT: { symbol: "MNT", geckoId: "mantle", names: ["mantle"] },
};

/** Soft ceiling — Binance alone lists ~450 USDT bases; keep majors-sized. */
const CATALOG_CAP = 320;
const REVALIDATE_SECONDS = 12 * 60 * 60;

const FETCH_HEADERS: HeadersInit = {
  Accept: "application/json",
  "User-Agent": "AltCoinDepot/1.0 (+https://altcoindepot.com)",
};

const BINANCE_BASES = [
  "https://data-api.binance.vision",
  "https://data.binance.com",
  "https://api.binance.com",
] as const;

const FIAT_OR_STABLE = new Set([
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "AUD",
  "CAD",
  "CHF",
  "CNY",
  "HKD",
  "SGD",
  "INR",
  "BRL",
  "TRY",
  "ZAR",
  "MXN",
  "AED",
  "ARS",
  "USDT",
  "USDC",
  "BUSD",
  "FDUSD",
  "TUSD",
  "USDE",
  "DAI",
  "USD1",
  "EURC",
  "PYUSD",
]);

type Lookup = {
  bySymbol: Map<string, MajorCatalogEntry>;
  byName: Map<string, MajorCatalogEntry>;
  byGeckoId: Map<string, MajorCatalogEntry>;
};

let memoryLookup: Lookup | null = null;
let memoryCatalog: MajorCatalogEntry[] | null = null;

function titleCaseName(raw: string): string {
  const s = raw.trim();
  if (!s) return s;
  if (s === s.toUpperCase() && s.length <= 6) return s;
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function addName(set: Set<string>, value: string | null | undefined) {
  const v = (value ?? "").trim().toLowerCase();
  if (!v) return;
  set.add(v);
}

async function fetchJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, {
      headers: FETCH_HEADERS,
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

type CoinbaseCurrencyRow = {
  symbol: string;
  name: string;
  sortOrder: number;
  preferred?: MajorPreferredContract;
};

async function loadCoinbase(): Promise<{
  bySymbol: Map<string, CoinbaseCurrencyRow>;
  productBases: Set<string>;
}> {
  const bySymbol = new Map<string, CoinbaseCurrencyRow>();
  const productBases = new Set<string>();

  const [currenciesRaw, productsRaw] = await Promise.all([
    fetchJson("https://api.exchange.coinbase.com/currencies"),
    fetchJson("https://api.exchange.coinbase.com/products"),
  ]);

  if (Array.isArray(productsRaw)) {
    for (const row of productsRaw) {
      if (!row || typeof row !== "object") continue;
      const base =
        typeof (row as { base_currency?: unknown }).base_currency === "string"
          ? (row as { base_currency: string }).base_currency.toUpperCase()
          : "";
      const quote =
        typeof (row as { quote_currency?: unknown }).quote_currency === "string"
          ? (row as { quote_currency: string }).quote_currency.toUpperCase()
          : "";
      const status =
        typeof (row as { status?: unknown }).status === "string"
          ? (row as { status: string }).status.toLowerCase()
          : "";
      if (!base || status === "delisted") continue;
      if (quote !== "USD" && quote !== "USDT" && quote !== "USDC") continue;
      if (FIAT_OR_STABLE.has(base)) continue;
      productBases.add(base);
    }
  }

  if (Array.isArray(currenciesRaw)) {
    for (const row of currenciesRaw) {
      if (!row || typeof row !== "object") continue;
      const id =
        typeof (row as { id?: unknown }).id === "string"
          ? (row as { id: string }).id.toUpperCase()
          : "";
      const name =
        typeof (row as { name?: unknown }).name === "string"
          ? (row as { name: string }).name.trim()
          : "";
      const status =
        typeof (row as { status?: unknown }).status === "string"
          ? (row as { status: string }).status.toLowerCase()
          : "";
      const type =
        typeof (row as { details?: { type?: unknown } }).details?.type === "string"
          ? String((row as { details: { type: string } }).details.type).toLowerCase()
          : "crypto";
      if (!id || !name || status !== "online" || type !== "crypto") continue;
      if (FIAT_OR_STABLE.has(id)) continue;

      const sortOrderRaw = (row as { details?: { sort_order?: unknown } }).details?.sort_order;
      const sortOrder =
        typeof sortOrderRaw === "number" && Number.isFinite(sortOrderRaw) ? sortOrderRaw : 9999;

      let preferred: MajorPreferredContract | undefined;
      const networks = (row as { supported_networks?: unknown }).supported_networks;
      if (Array.isArray(networks)) {
        for (const net of networks) {
          if (!net || typeof net !== "object") continue;
          const netId =
            typeof (net as { id?: unknown }).id === "string"
              ? (net as { id: string }).id.toLowerCase()
              : "";
          const addr =
            typeof (net as { contract_address?: unknown }).contract_address === "string"
              ? (net as { contract_address: string }).contract_address.trim()
              : "";
          const netStatus =
            typeof (net as { status?: unknown }).status === "string"
              ? (net as { status: string }).status.toLowerCase()
              : "";
          if (!addr || netStatus === "delisted") continue;
          const chain =
            netId === "ethereum"
              ? "ethereum"
              : netId === "solana"
                ? "solana"
                : netId === "base"
                  ? "base"
                  : netId === "arbitrum"
                    ? "arbitrum"
                    : netId === "optimism"
                      ? "optimism"
                      : netId === "polygon"
                        ? "polygon"
                        : netId === "bsc" || netId === "binance-smart-chain"
                          ? "bsc"
                          : null;
          if (!chain) continue;
          preferred = { chain, address: addr };
          if (chain === "ethereum") break;
        }
      }

      bySymbol.set(id, { symbol: id, name, sortOrder, preferred });
    }
  }

  return { bySymbol, productBases };
}

async function loadBinanceUsdtBases(): Promise<Set<string>> {
  const out = new Set<string>();
  for (const base of BINANCE_BASES) {
    const raw = await fetchJson(`${base}/api/v3/exchangeInfo`);
    if (!raw || typeof raw !== "object") continue;
    const symbols = (raw as { symbols?: unknown }).symbols;
    if (!Array.isArray(symbols)) continue;
    for (const row of symbols) {
      if (!row || typeof row !== "object") continue;
      const quote =
        typeof (row as { quoteAsset?: unknown }).quoteAsset === "string"
          ? (row as { quoteAsset: string }).quoteAsset.toUpperCase()
          : "";
      const status =
        typeof (row as { status?: unknown }).status === "string"
          ? (row as { status: string }).status.toUpperCase()
          : "";
      const asset =
        typeof (row as { baseAsset?: unknown }).baseAsset === "string"
          ? (row as { baseAsset: string }).baseAsset.toUpperCase()
          : "";
      if (quote !== "USDT" || status !== "TRADING" || !asset) continue;
      if (FIAT_OR_STABLE.has(asset)) continue;
      out.add(asset);
    }
    if (out.size > 0) break;
  }
  return out;
}

function buildLookup(catalog: MajorCatalogEntry[]): Lookup {
  const bySymbol = new Map<string, MajorCatalogEntry>();
  const byName = new Map<string, MajorCatalogEntry>();
  const byGeckoId = new Map<string, MajorCatalogEntry>();

  for (const entry of catalog) {
    if (!bySymbol.has(entry.symbol)) bySymbol.set(entry.symbol, entry);
    if (entry.geckoId && !byGeckoId.has(entry.geckoId)) {
      byGeckoId.set(entry.geckoId.toLowerCase(), entry);
    }
    for (const n of entry.names) {
      if (!byName.has(n)) byName.set(n, entry);
    }
  }
  return { bySymbol, byName, byGeckoId };
}

function seedFallbackCatalog(): MajorCatalogEntry[] {
  const out: MajorCatalogEntry[] = [];
  for (const seed of Object.values(SEED_BY_SYMBOL)) {
    const names = new Set<string>();
    addName(names, seed.symbol);
    addName(names, seed.geckoId);
    for (const n of seed.names ?? []) addName(names, n);
    out.push({
      symbol: seed.symbol,
      name: titleCaseName(seed.names?.[0] ?? seed.symbol),
      names: [...names],
      geckoId: seed.geckoId,
      preferred: seed.preferred,
      sources: ["coinbase", "binance"],
    });
  }
  // Prefer human names for well-known seeds
  const rename: Record<string, string> = {
    BTC: "Bitcoin",
    ETH: "Ethereum",
    INJ: "Injective",
    SOL: "Solana",
    BNB: "BNB",
    XRP: "XRP",
    DOGE: "Dogecoin",
    ADA: "Cardano",
    LINK: "Chainlink",
    AVAX: "Avalanche",
  };
  for (const e of out) {
    if (rename[e.symbol]) e.name = rename[e.symbol]!;
  }
  return out;
}

async function buildMajorsCatalogUncached(): Promise<MajorCatalogEntry[]> {
  const [coinbase, binanceBases] = await Promise.all([loadCoinbase(), loadBinanceUsdtBases()]);

  if (coinbase.bySymbol.size === 0 && binanceBases.size === 0) {
    console.warn("[majors-catalog] Coinbase+Binance empty — using seed fallback");
    return seedFallbackCatalog();
  }

  type Draft = {
    symbol: string;
    name: string;
    sortOrder: number;
    sources: Set<"coinbase" | "binance">;
    preferred?: MajorPreferredContract;
    onProduct: boolean;
  };

  const drafts = new Map<string, Draft>();

  for (const [symbol, row] of coinbase.bySymbol) {
    const onProduct = coinbase.productBases.has(symbol);
    // Prefer currencies that actually trade on Coinbase USD rails; keep others if Binance confirms.
    drafts.set(symbol, {
      symbol,
      name: row.name,
      sortOrder: row.sortOrder,
      sources: new Set(["coinbase"]),
      preferred: row.preferred,
      onProduct,
    });
  }

  for (const symbol of binanceBases) {
    const existing = drafts.get(symbol);
    if (existing) {
      existing.sources.add("binance");
      continue;
    }
    drafts.set(symbol, {
      symbol,
      name: symbol,
      sortOrder: 5000,
      sources: new Set(["binance"]),
      onProduct: false,
    });
  }

  // Ensure seed majors always present even if a venue hiccups.
  for (const seed of Object.values(SEED_BY_SYMBOL)) {
    if (drafts.has(seed.symbol)) continue;
    drafts.set(seed.symbol, {
      symbol: seed.symbol,
      name: titleCaseName(seed.names?.[0] ?? seed.symbol),
      sortOrder: 0,
      sources: new Set(["coinbase", "binance"]),
      preferred: seed.preferred,
      onProduct: true,
    });
  }

  const ranked = [...drafts.values()].sort((a, b) => {
    const score = (d: Draft) => {
      let s = 0;
      if (d.sources.has("coinbase") && d.sources.has("binance")) s += 300;
      else if (d.sources.has("coinbase")) s += 200;
      else s += 100;
      if (d.onProduct) s += 50;
      if (SEED_BY_SYMBOL[d.symbol]) s += 80;
      return s;
    };
    const sa = score(a);
    const sb = score(b);
    if (sb !== sa) return sb - sa;
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.symbol.localeCompare(b.symbol);
  });

  const sliced = ranked.slice(0, CATALOG_CAP);
  const catalog: MajorCatalogEntry[] = [];

  for (const d of sliced) {
    const seed = SEED_BY_SYMBOL[d.symbol];
    const names = new Set<string>();
    addName(names, d.symbol);
    addName(names, d.name);
    if (seed?.geckoId) addName(names, seed.geckoId);
    for (const n of seed?.names ?? []) addName(names, n);

    // Coinbase calls ETH "Ether" — keep ethereum searchable.
    if (d.symbol === "ETH") addName(names, "ethereum");
    if (d.symbol === "BTC") addName(names, "bitcoin");
    if (d.symbol === "INJ") {
      addName(names, "injective");
      addName(names, "injective protocol");
    }

    const displayName =
      d.symbol === "ETH"
        ? "Ethereum"
        : d.symbol === "BTC"
          ? "Bitcoin"
          : d.symbol === "INJ"
            ? "Injective"
            : d.name && d.name !== d.symbol
              ? d.name
              : titleCaseName(seed?.names?.[0] ?? d.symbol);

    catalog.push({
      symbol: d.symbol,
      name: displayName,
      names: [...names],
      geckoId: seed?.geckoId ?? null,
      preferred: seed?.preferred ?? d.preferred,
      sources: [...d.sources],
    });
  }

  console.info("[majors-catalog] built", {
    count: catalog.length,
    coinbase: coinbase.bySymbol.size,
    binanceUsdt: binanceBases.size,
    both: catalog.filter((e) => e.sources.includes("coinbase") && e.sources.includes("binance"))
      .length,
  });

  return catalog;
}

const getCachedMajorsCatalog = unstable_cache(
  buildMajorsCatalogUncached,
  ["majors-catalog-cb-bn-v1"],
  { revalidate: REVALIDATE_SECONDS },
);

export async function getMajorsCatalog(): Promise<MajorCatalogEntry[]> {
  try {
    const catalog = await getCachedMajorsCatalog();
    if (catalog.length > 0) {
      memoryCatalog = catalog;
      memoryLookup = buildLookup(catalog);
      return catalog;
    }
  } catch (err) {
    console.warn("[majors-catalog] cache build failed", err);
  }
  const fallback = seedFallbackCatalog();
  memoryCatalog = fallback;
  memoryLookup = buildLookup(fallback);
  return fallback;
}

function lookupFrom(query: string, lookup: Lookup): MajorCatalogEntry | null {
  const q = query.trim();
  if (!q) return null;
  const lower = q.toLowerCase();
  const upper = q.toUpperCase();

  const bySym = lookup.bySymbol.get(upper);
  if (bySym) return bySym;

  const byId = lookup.byGeckoId.get(lower);
  if (byId) return byId;

  const byName = lookup.byName.get(lower);
  if (byName) return byName;

  return null;
}

/**
 * Sync resolve — uses warm memory catalog, else seed fallback.
 * Call getMajorsCatalog() in the request path first so memory is warm.
 */
export function resolveMajorSync(query: string): MajorCatalogEntry | null {
  if (memoryLookup) return lookupFrom(query, memoryLookup);
  const fallback = seedFallbackCatalog();
  return lookupFrom(query, buildLookup(fallback));
}

export async function resolveMajor(query: string): Promise<MajorCatalogEntry | null> {
  await getMajorsCatalog();
  return resolveMajorSync(query);
}

export function isCanonicalMajorGeckoId(id: string): boolean {
  const lookup = memoryLookup ?? buildLookup(seedFallbackCatalog());
  return lookup.byGeckoId.has(id.trim().toLowerCase());
}

export function majorByGeckoId(id: string): MajorCatalogEntry | null {
  const lookup = memoryLookup ?? buildLookup(seedFallbackCatalog());
  return lookup.byGeckoId.get(id.trim().toLowerCase()) ?? null;
}

/** Symbols that belong to the same major family (BTC↔WBTC). */
export function majorFamilySymbols(major: MajorCatalogEntry): Set<string> {
  const out = new Set<string>([major.symbol.toUpperCase()]);
  if (major.symbol === "BTC") {
    out.add("WBTC");
    out.add("CBBTC");
  }
  if (major.symbol === "ETH") {
    out.add("WETH");
    out.add("STETH");
    out.add("WSTETH");
    out.add("RETH");
  }
  if (major.symbol === "SOL") out.add("WSOL");
  if (major.symbol === "BNB") out.add("WBNB");
  if (major.symbol === "AVAX") out.add("WAVAX");
  return out;
}

/** Known wrapped-contract addresses for “same asset” pair ranking. */
export function isKnownFamilyContract(major: MajorCatalogEntry, address: string): boolean {
  const a = address.trim().toLowerCase();
  if (!a) return false;
  if (major.preferred?.address.toLowerCase() === a) return true;
  const seed = SEED_BY_SYMBOL[major.symbol];
  if (seed?.preferred?.address.toLowerCase() === a) return true;
  if (major.symbol === "BTC") {
    const wbtc = SEED_BY_SYMBOL.WBTC?.preferred?.address.toLowerCase();
    if (wbtc && wbtc === a) return true;
  }
  if (major.symbol === "ETH") {
    const weth = SEED_BY_SYMBOL.WETH?.preferred?.address.toLowerCase();
    if (weth && weth === a) return true;
  }
  return false;
}

export function peekMajorsCatalog(): MajorCatalogEntry[] | null {
  return memoryCatalog;
}
