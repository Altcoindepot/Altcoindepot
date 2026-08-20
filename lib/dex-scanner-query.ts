/** Shareable URL query for /dex-scanner advanced filters. */

export const SCANNER_SORTS = ["volume", "liquidity", "mcap", "change", "newest"] as const;
export type ScannerSort = (typeof SCANNER_SORTS)[number];

export const SCANNER_DIRS = ["desc", "asc"] as const;
export type ScannerDir = (typeof SCANNER_DIRS)[number];

export type DexScannerQuery = {
  chain: string;
  minLiq: number;
  maxLiq: number | null;
  minVol: number;
  maxVol: number | null;
  minMcap: number;
  maxMcap: number | null;
  sort: ScannerSort;
  dir: ScannerDir;
  q: string;
  /** Include BTC/ETH/SOL majors (USDT-preferred pairs). Default true. */
  includeMajors: boolean;
};

/** Sane defaults — user may open to 0; dead rows still guarded in apply. */
export const DEX_SCANNER_DEFAULT_QUERY: DexScannerQuery = {
  chain: "all",
  minLiq: 5_000,
  maxLiq: null,
  minVol: 1_000,
  maxVol: null,
  minMcap: 0,
  maxMcap: null,
  sort: "volume",
  dir: "desc",
  q: "",
  includeMajors: true,
};

export const SCANNER_CHAIN_CHIPS = [
  { id: "all", label: "All" },
  { id: "solana", label: "Solana" },
  { id: "ethereum", label: "Ethereum" },
  { id: "base", label: "Base" },
  { id: "bsc", label: "BSC" },
  { id: "arbitrum", label: "Arbitrum" },
  { id: "polygon", label: "Polygon" },
  { id: "avalanche", label: "Avalanche" },
] as const;

function parseNonNegNumber(raw: string | null, fallback: number): number {
  if (raw == null || raw.trim() === "") return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return n;
}

function parseOptionalMax(raw: string | null): number | null {
  if (raw == null || raw.trim() === "" || raw === "none" || raw === "inf") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function isSort(v: string | null): v is ScannerSort {
  return SCANNER_SORTS.includes(v as ScannerSort);
}

function isDir(v: string | null): v is ScannerDir {
  return SCANNER_DIRS.includes(v as ScannerDir);
}

export function parseDexScannerQuery(
  sp: { get(name: string): string | null },
  defaults: DexScannerQuery = DEX_SCANNER_DEFAULT_QUERY,
): DexScannerQuery {
  const sortRaw = sp.get("sort");
  const dirRaw = sp.get("dir");
  const chainRaw = sp.get("chain")?.trim().toLowerCase() ?? "";
  const majorsRaw = sp.get("majors");
  const maxLiqRaw = sp.get("maxLiq");
  const maxVolRaw = sp.get("maxVol");
  const maxMcapRaw = sp.get("maxMcap");
  return {
    chain: chainRaw && chainRaw !== "all" ? chainRaw : defaults.chain,
    minLiq: parseNonNegNumber(sp.get("minLiq"), defaults.minLiq),
    maxLiq: maxLiqRaw != null ? parseOptionalMax(maxLiqRaw) : defaults.maxLiq,
    minVol: parseNonNegNumber(sp.get("minVol"), defaults.minVol),
    maxVol: maxVolRaw != null ? parseOptionalMax(maxVolRaw) : defaults.maxVol,
    minMcap: parseNonNegNumber(sp.get("minMcap"), defaults.minMcap),
    maxMcap: maxMcapRaw != null ? parseOptionalMax(maxMcapRaw) : defaults.maxMcap,
    sort: isSort(sortRaw) ? sortRaw : defaults.sort,
    dir: isDir(dirRaw) ? dirRaw : defaults.dir,
    q: (sp.get("q") ?? defaults.q).trim(),
    includeMajors:
      majorsRaw == null
        ? defaults.includeMajors
        : !(majorsRaw === "0" || majorsRaw === "false" || majorsRaw === "off"),
  };
}

export function dexScannerSearchParams(
  query: DexScannerQuery,
  defaults: DexScannerQuery = DEX_SCANNER_DEFAULT_QUERY,
): string {
  const params = new URLSearchParams();
  if (query.chain !== defaults.chain && query.chain !== "all") params.set("chain", query.chain);
  if (query.minLiq !== defaults.minLiq) params.set("minLiq", String(query.minLiq));
  if (query.maxLiq != null) params.set("maxLiq", String(query.maxLiq));
  if (query.minVol !== defaults.minVol) params.set("minVol", String(query.minVol));
  if (query.maxVol != null) params.set("maxVol", String(query.maxVol));
  if (query.minMcap !== defaults.minMcap) params.set("minMcap", String(query.minMcap));
  if (query.maxMcap != null) params.set("maxMcap", String(query.maxMcap));
  if (query.sort !== defaults.sort) params.set("sort", query.sort);
  if (query.dir !== defaults.dir) params.set("dir", query.dir);
  if (query.q) params.set("q", query.q);
  if (query.includeMajors !== defaults.includeMajors) {
    params.set("majors", query.includeMajors ? "1" : "0");
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function scannerQuerySummary(query: DexScannerQuery): string {
  const parts: string[] = [];
  parts.push(query.chain === "all" ? "All chains" : query.chain);
  parts.push(`Liq ≥ $${query.minLiq.toLocaleString("en-US")}`);
  if (query.maxLiq != null) parts.push(`Liq ≤ $${query.maxLiq.toLocaleString("en-US")}`);
  parts.push(`Vol ≥ $${query.minVol.toLocaleString("en-US")}`);
  if (query.maxVol != null) parts.push(`Vol ≤ $${query.maxVol.toLocaleString("en-US")}`);
  if (query.minMcap > 0) parts.push(`Mcap ≥ $${query.minMcap.toLocaleString("en-US")}`);
  if (query.maxMcap != null) parts.push(`Mcap ≤ $${query.maxMcap.toLocaleString("en-US")}`);
  parts.push(`${query.sort} ${query.dir}`);
  if (query.q) parts.push(`“${query.q}”`);
  if (!query.includeMajors) parts.push("No majors");
  return parts.join(" · ");
}
