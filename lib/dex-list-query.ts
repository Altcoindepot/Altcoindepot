import { formatChainLabel } from "@/lib/format-chain";

export const DEX_LIST_SORTS = ["newest", "volume", "liquidity", "gainers", "losers"] as const;
export type DexListSort = (typeof DEX_LIST_SORTS)[number];

export const DEX_LIST_DIRS = ["desc", "asc"] as const;
export type DexListDir = (typeof DEX_LIST_DIRS)[number];

export const DEX_LIST_MIN_LIQ = ["all", "25k", "50k"] as const;
export type DexListMinLiq = (typeof DEX_LIST_MIN_LIQ)[number];

export type DexListQuery = {
  sort: DexListSort;
  dir: DexListDir;
  chain: string;
  minLiq: DexListMinLiq;
};

export const DEFAULT_DEX_LIST_QUERY: DexListQuery = {
  sort: "newest",
  dir: "desc",
  chain: "all",
  minLiq: "all",
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

export function sortUsesDir(sort: DexListSort): boolean {
  return sort === "newest" || sort === "volume" || sort === "liquidity";
}

export function dexListDirLabel(sort: DexListSort, dir: DexListDir): string {
  if (sort === "newest") return dir === "asc" ? "Oldest first" : "Newest first";
  return dir === "asc" ? "Low → high" : "High → low";
}

export const MAJOR_DEX_CHAIN_FILTERS = [
  { id: "solana", label: "SOL" },
  { id: "eth", label: "ETH" },
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

export function parseDexListQuery(sp: {
  get(name: string): string | null;
}): DexListQuery {
  const sortRaw = sp.get("sort");
  const dirRaw = sp.get("dir");
  const chainRaw = sp.get("chain")?.trim().toLowerCase() ?? "";
  const minLiqRaw = sp.get("minLiq");
  const sort = isSort(sortRaw) ? sortRaw : DEFAULT_DEX_LIST_QUERY.sort;
  return {
    sort,
    dir: sortUsesDir(sort) && isDir(dirRaw) ? dirRaw : DEFAULT_DEX_LIST_QUERY.dir,
    chain: chainRaw && chainRaw !== "all" ? chainRaw : "all",
    minLiq: isMinLiq(minLiqRaw) ? minLiqRaw : DEFAULT_DEX_LIST_QUERY.minLiq,
  };
}

export function chainMatches(rowChain: string | undefined, filter: string): boolean {
  if (!filter || filter === "all") return true;
  const row = (rowChain ?? "").trim().toLowerCase();
  const want = filter.trim().toLowerCase();
  if (!row) return false;
  if (row === want) return true;
  return formatChainLabel(row) === formatChainLabel(want);
}

export function applyDexListQuery<T extends DexListSortable>(rows: T[], query: DexListQuery): T[] {
  const minUsd = MIN_LIQ_USD[query.minLiq];
  const filtered = rows.filter((row) => {
    if (!chainMatches(row.chain, query.chain)) return false;
    if (minUsd > 0 && (row.liquidity ?? 0) < minUsd) return false;
    return true;
  });

  const missing = Number.NEGATIVE_INFINITY;
  const copy = [...filtered];
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
  if (query.minLiq !== "all") parts.push(DEX_LIST_MIN_LIQ_LABELS[query.minLiq]);
  return parts.join(" · ");
}

export function dexListQuerySearchParams(
  query: DexListQuery,
  extra?: URLSearchParams | null,
): string {
  const params = extra ? new URLSearchParams(extra.toString()) : new URLSearchParams();
  params.delete("sort");
  params.delete("dir");
  params.delete("chain");
  params.delete("minLiq");
  const custom =
    query.sort !== DEFAULT_DEX_LIST_QUERY.sort ||
    (sortUsesDir(query.sort) && query.dir !== DEFAULT_DEX_LIST_QUERY.dir) ||
    query.chain !== "all" ||
    query.minLiq !== DEFAULT_DEX_LIST_QUERY.minLiq;
  if (custom) {
    params.set("sort", query.sort);
    if (sortUsesDir(query.sort) && query.dir !== DEFAULT_DEX_LIST_QUERY.dir) {
      params.set("dir", query.dir);
    }
    if (query.chain !== "all") params.set("chain", query.chain);
    if (query.minLiq !== DEFAULT_DEX_LIST_QUERY.minLiq) params.set("minLiq", query.minLiq);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
