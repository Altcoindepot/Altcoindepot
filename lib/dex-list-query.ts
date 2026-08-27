import { formatChainLabel } from "@/lib/format-chain";
import { sameDexChain, normalizeDexChainId } from "@/lib/dex-token-path";

export const DEX_LIST_SORTS = ["newest", "volume", "liquidity", "gainers", "losers"] as const;
export type DexListSort = (typeof DEX_LIST_SORTS)[number];

export const DEX_LIST_DIRS = ["desc", "asc"] as const;
export type DexListDir = (typeof DEX_LIST_DIRS)[number];

export const DEX_LIST_MIN_LIQ = ["all", "25k", "50k"] as const;
export type DexListMinLiq = (typeof DEX_LIST_MIN_LIQ)[number];

export const DEX_LIST_AGES = ["5m", "15m", "1h", "6h", "24h", "all"] as const;
export type DexListAge = (typeof DEX_LIST_AGES)[number];

export const DEX_LIST_PULSES = ["all", "pumping", "dumping", "fresh", "high-liq"] as const;
export type DexListPulse = (typeof DEX_LIST_PULSES)[number];

export type DexListQuery = {
  sort: DexListSort;
  dir: DexListDir;
  chain: string;
  minLiq: DexListMinLiq;
  age: DexListAge;
  pulse: DexListPulse;
};

export const DEFAULT_DEX_LIST_QUERY: DexListQuery = {
  sort: "newest",
  dir: "desc",
  chain: "all",
  minLiq: "all",
  age: "all",
  pulse: "all",
};

/** New & Low Caps: older pairs; min liq enforced in data layer (≥$10k / UI $25k default). */
export const LOW_CAPS_DEFAULT_QUERY: DexListQuery = {
  sort: "newest",
  dir: "desc",
  chain: "all",
  minLiq: "25k",
  age: "all",
  pulse: "all",
};

/** Just Launched: newest within 0–15m (server also hard-filters pairCreatedAt). */
export const JUST_LAUNCHED_DEFAULT_QUERY: DexListQuery = {
  sort: "newest",
  dir: "desc",
  chain: "all",
  minLiq: "all",
  age: "15m",
  pulse: "all",
};

/** /pairs explorer: volume-first with shareable chain/sort params. */
export const PAIRS_DEFAULT_QUERY: DexListQuery = {
  sort: "volume",
  dir: "desc",
  chain: "all",
  minLiq: "25k",
  age: "all",
  pulse: "all",
};

export const DEX_LIST_SORT_LABELS: Record<DexListSort, string> = {
  newest: "Most recent",
  volume: "Highest volume",
  liquidity: "Highest liquidity",
  gainers: "Biggest 24h gainers",
  losers: "Biggest 24h losers",
};

export const DEX_LIST_SORT_SHORT: Record<DexListSort, string> = {
  newest: "Newest",
  volume: "Volume",
  liquidity: "Liquidity",
  gainers: "Gainers",
  losers: "Losers",
};

export const DEX_LIST_MIN_LIQ_LABELS: Record<DexListMinLiq, string> = {
  all: "All liquidity",
  "25k": "$25k+",
  "50k": "$50k+",
};

export const DEX_LIST_AGE_LABELS: Record<DexListAge, string> = {
  "5m": "5m",
  "15m": "15m",
  "1h": "1h",
  "6h": "6h",
  "24h": "24h",
  all: "All ages",
};

export const DEX_LIST_PULSE_LABELS: Record<DexListPulse, string> = {
  all: "All",
  pumping: "Pumping",
  dumping: "Dumping",
  fresh: "Fresh",
  "high-liq": "High liq",
};

const AGE_MS: Record<DexListAge, number> = {
  "5m": 5 * 60_000,
  "15m": 15 * 60_000,
  "1h": 60 * 60_000,
  "6h": 6 * 60 * 60_000,
  "24h": 24 * 60 * 60_000,
  all: Number.POSITIVE_INFINITY,
};

export function sortUsesDir(sort: DexListSort): boolean {
  return sort === "newest" || sort === "volume" || sort === "liquidity";
}

export function dexListDirLabel(sort: DexListSort, dir: DexListDir): string {
  if (sort === "newest") return dir === "asc" ? "Oldest first" : "Newest first";
  return dir === "asc" ? "Low → high" : "High → low";
}

export const MAJOR_DEX_CHAIN_FILTERS = [
  { id: "solana", label: "SOL" },
  { id: "ethereum", label: "ETH" },
  { id: "base", label: "BASE" },
  { id: "bsc", label: "BSC" },
  { id: "arbitrum", label: "ARB" },
  { id: "polygon", label: "POL" },
  { id: "avalanche", label: "AVAX" },
] as const;

const MIN_LIQ_USD: Record<DexListMinLiq, number> = {
  all: 0,
  "25k": 25_000,
  "50k": 50_000,
};

export type DexListSortable = {
  id?: string;
  chain?: string;
  liquidity?: number | null;
  volume?: number | null;
  change24h?: number | null;
  pairCreatedAt?: number | null;
};

function isSort(value: string | null): value is DexListSort {
  return DEX_LIST_SORTS.includes(value as DexListSort);
}

function isDir(value: string | null): value is DexListDir {
  return DEX_LIST_DIRS.includes(value as DexListDir);
}

function isMinLiq(value: string | null): value is DexListMinLiq {
  return DEX_LIST_MIN_LIQ.includes(value as DexListMinLiq);
}

function isAge(value: string | null): value is DexListAge {
  return DEX_LIST_AGES.includes(value as DexListAge);
}

function isPulse(value: string | null): value is DexListPulse {
  return DEX_LIST_PULSES.includes(value as DexListPulse);
}

export function parseDexListQuery(
  sp: { get(name: string): string | null },
  defaults: DexListQuery = DEFAULT_DEX_LIST_QUERY,
): DexListQuery {
  const sortRaw = sp.get("sort");
  const dirRaw = sp.get("dir");
  const chainRaw = sp.get("chain")?.trim().toLowerCase() ?? "";
  const chainCanonical =
    chainRaw && chainRaw !== "all" ? (normalizeDexChainId(chainRaw) ?? chainRaw) : "";
  const minLiqRaw = sp.get("minLiq");
  const ageRaw = sp.get("age");
  const pulseRaw = sp.get("pulse");
  const sort = isSort(sortRaw) ? sortRaw : defaults.sort;
  return {
    sort,
    dir: sortUsesDir(sort) && isDir(dirRaw) ? dirRaw : defaults.dir,
    chain: chainCanonical || defaults.chain,
    minLiq: isMinLiq(minLiqRaw) ? minLiqRaw : defaults.minLiq,
    age: isAge(ageRaw) ? ageRaw : defaults.age,
    pulse: isPulse(pulseRaw) ? pulseRaw : defaults.pulse,
  };
}

export function chainMatches(rowChain: string | undefined, filter: string): boolean {
  if (!filter || filter === "all") return true;
  // Accept eth/ethereum, sol/solana, etc. — never mix chains.
  if (sameDexChain(rowChain, filter)) return true;
  const row = normalizeDexChainId(rowChain) ?? (rowChain ?? "").trim().toLowerCase();
  const want = normalizeDexChainId(filter) ?? filter.trim().toLowerCase();
  if (!row || !want) return false;
  if (row === want) return true;
  return formatChainLabel(row) === formatChainLabel(want);
}

function applyPulse<T extends DexListSortable>(rows: T[], pulse: DexListPulse): T[] {
  if (pulse === "all" || rows.length === 0) return rows;
  if (pulse === "pumping") {
    return [...rows]
      .filter((r) => (r.change24h ?? 0) > 0)
      .sort((a, b) => (b.change24h ?? 0) - (a.change24h ?? 0))
      .slice(0, 8);
  }
  if (pulse === "dumping") {
    return [...rows]
      .filter((r) => (r.change24h ?? 0) < 0)
      .sort((a, b) => (a.change24h ?? 0) - (b.change24h ?? 0))
      .slice(0, 8);
  }
  if (pulse === "high-liq") {
    return [...rows]
      .filter((r) => (r.liquidity ?? 0) > 0)
      .sort((a, b) => (b.liquidity ?? 0) - (a.liquidity ?? 0))
      .slice(0, 8);
  }
  return [...rows]
    .filter((r) => r.pairCreatedAt != null)
    .sort((a, b) => (b.pairCreatedAt ?? 0) - (a.pairCreatedAt ?? 0))
    .slice(0, 8);
}

export function applyDexListQuery<T extends DexListSortable>(
  rows: T[],
  query: DexListQuery,
  now = Date.now(),
): T[] {
  const minUsd = MIN_LIQ_USD[query.minLiq];
  const maxAge = AGE_MS[query.age];
  const filtered = rows.filter((row) => {
    if (!chainMatches(row.chain, query.chain)) return false;
    if (minUsd > 0 && (row.liquidity ?? 0) < minUsd) return false;
    if (maxAge < Number.POSITIVE_INFINITY) {
      const created = row.pairCreatedAt;
      if (created == null || !Number.isFinite(created)) return false;
      if (now - created > maxAge) return false;
    }
    return true;
  });

  const pulsed = applyPulse(filtered, query.pulse);

  const missing = Number.NEGATIVE_INFINITY;
  const copy = [...pulsed];
  const dir = sortUsesDir(query.sort) ? query.dir : query.sort === "losers" ? "asc" : "desc";
  copy.sort((a, b) => {
    let cmp = 0;
    if (query.sort === "newest") {
      cmp = (b.pairCreatedAt ?? missing) - (a.pairCreatedAt ?? missing);
    } else if (query.sort === "volume") {
      cmp = (b.volume ?? missing) - (a.volume ?? missing);
    } else if (query.sort === "liquidity") {
      cmp = (b.liquidity ?? missing) - (a.liquidity ?? missing);
    } else if (query.sort === "gainers") {
      cmp = (b.change24h ?? missing) - (a.change24h ?? missing);
    } else {
      cmp = (a.change24h ?? Number.POSITIVE_INFINITY) - (b.change24h ?? Number.POSITIVE_INFINITY);
    }
    return dir === "asc" && sortUsesDir(query.sort) ? -cmp : cmp;
  });
  return copy;
}

export function dexListQuerySummary(query: DexListQuery, chainLabel: string): string {
  const sortLabel =
    query.sort === "newest" && query.dir === "asc" ? "Oldest" : DEX_LIST_SORT_SHORT[query.sort];
  const parts = [sortLabel];
  if (sortUsesDir(query.sort) && query.dir === "asc" && query.sort !== "newest") {
    parts.push("Low→high");
  }
  parts.push(query.chain === "all" ? "All" : chainLabel);
  if (query.age !== "all") parts.push(DEX_LIST_AGE_LABELS[query.age]);
  if (query.minLiq !== "all") parts.push(DEX_LIST_MIN_LIQ_LABELS[query.minLiq]);
  if (query.pulse !== "all") parts.push(DEX_LIST_PULSE_LABELS[query.pulse]);
  return parts.join(" · ");
}

export function dexListQuerySearchParams(
  query: DexListQuery,
  extra?: URLSearchParams | null,
  defaults: DexListQuery = DEFAULT_DEX_LIST_QUERY,
): string {
  const params = extra ? new URLSearchParams(extra.toString()) : new URLSearchParams();
  params.delete("sort");
  params.delete("dir");
  params.delete("chain");
  params.delete("minLiq");
  params.delete("age");
  params.delete("pulse");
  const custom =
    query.sort !== defaults.sort ||
    (sortUsesDir(query.sort) && query.dir !== defaults.dir) ||
    query.chain !== defaults.chain ||
    query.minLiq !== defaults.minLiq ||
    query.age !== defaults.age ||
    query.pulse !== defaults.pulse;
  if (custom) {
    if (query.sort !== defaults.sort) params.set("sort", query.sort);
    if (sortUsesDir(query.sort) && query.dir !== defaults.dir) params.set("dir", query.dir);
    if (query.chain !== "all" && query.chain !== defaults.chain) params.set("chain", query.chain);
    if (query.minLiq !== defaults.minLiq) params.set("minLiq", query.minLiq);
    if (query.age !== defaults.age) params.set("age", query.age);
    if (query.pulse !== defaults.pulse) params.set("pulse", query.pulse);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function formatFreshness(fetchedAt: number | null | undefined, now = Date.now()): string {
  if (fetchedAt == null || !Number.isFinite(fetchedAt)) return "Updated recently";
  const secs = Math.max(0, Math.round((now - fetchedAt) / 1000));
  if (secs < 5) return "Updated just now";
  if (secs < 60) return `Updated ${secs}s ago`;
  const mins = Math.round(secs / 60);
  if (mins < 60) return `Updated ${mins}m ago`;
  const hrs = Math.round(mins / 60);
  return `Updated ${hrs}h ago`;
}
