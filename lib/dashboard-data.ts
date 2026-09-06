import type { CoinMarket } from "@/lib/coingecko";
import { computeMarketRegime, type MarketRegime } from "@/lib/market-regime";
import {
  DEFAULT_ROTATION_WINDOW,
  NARRATIVES,
  rotationStatusFromChange,
  type NarrativeDef,
  type NarrativeStatus,
  type RotationWindow,
} from "@/lib/narratives";
import type { DexProjectLink } from "@/lib/dex-project-links";

/** Server cache TTL — CoinGecko free-tier friendly (1 hour). */
export const DASHBOARD_REVALIDATE_SECONDS = 3600;
const REVALIDATE = DASHBOARD_REVALIDATE_SECONDS;

export type NarrativeSnapshot = NarrativeDef & {
  change24h: number | null;
  change7d: number | null;
  change30d: number | null;
  /** Status for the default window (24h). */
  status: NarrativeStatus;
  sampleSize: number;
};

/** View model for a single selected rotation window. */
export type NarrativeView = NarrativeDef & {
  change: number | null;
  status: NarrativeStatus;
  sampleSize: number;
};

export type LowCapRow = {
  id: string;
  name: string;
  symbol: string;
  image: string;
  marketCap: number | null;
  /** USD liquidity when known (DexScreener pairs). */
  liquidity?: number | null;
  /** DexScreener chainId (ethereum, solana, base, bsc, …). */
  chain?: string;
  /** Base-token contract address. */
  contractAddress?: string;
  /** DexScreener pair address when known. */
  pairAddress?: string;
  /** DexScreener dexId (raydium, uniswap, …). */
  dexId?: string;
  /** Short venue label for badges. */
  dexLabel?: string;
  change7d: number | null;
  volume: number | null;
  /** USD price from DexScreener when available. */
  priceUsd?: number | null;
  narrativeSlug: string;
  narrativeTitle: string;
  narrativeColor: string;
  narrativeGlowClass: string;
  status: NarrativeStatus;
  /** Relative “added” label (best-effort from rank within basket). */
  addedLabel: string;
  /** Pair created-at timestamp (ms) when known. */
  pairCreatedAt?: number | null;
  /** Optional 7d sparkline prices from CoinGecko. */
  sparkline?: number[] | null;
  /** When set, token name links here instead of `/coin/[id]` (DexScreener rows). */
  href?: string;
  /** Website / socials from DexScreener when present. */
  projectLinks?: DexProjectLink[];
};

export type MarketPulse = {
  totalMarketCapUsd: number | null;
  marketCapChange24h: number | null;
  totalVolumeUsd: number | null;
  btcDominance: number | null;
  ethDominance: number | null;
  btcDominanceChange: number | null;
  ethDominanceChange: number | null;
};

export type TrendingAssetRow = {
  id: string;
  name: string;
  symbol: string;
  image: string;
  change24h: number | null;
  volume: number | null;
};

export type DashboardSnapshot = {
  narratives: NarrativeSnapshot[];
  ranking: NarrativeSnapshot[];
  topRotations: NarrativeSnapshot[];
  lowCaps: LowCapRow[];
  trendingAssets: TrendingAssetRow[];
  pulse: MarketPulse;
  regime: MarketRegime;
  /** Display label for sticky bar / hero (e.g. ROTATION). */
  regimeLabel: string;
  regimeSummary: string;
  cycleDay: number;
  cycleProgressPct: number;
  updatedAt: string;
  stale: boolean;
  /** True when the protective mock snapshot is serving instead of CoinGecko. */
  usingMock?: boolean;
  /** True when serving a previously successful live snapshot after a 429/empty fetch. */
  usingStale?: boolean;
};

function avgField(
  coins: CoinMarket[],
  pick: (c: CoinMarket) => number | null | undefined,
): { avg: number | null; n: number } {
  const vals = coins
    .map(pick)
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v))
    .slice(0, 25);
  if (vals.length === 0) return { avg: null, n: 0 };
  return { avg: vals.reduce((a, b) => a + b, 0) / vals.length, n: vals.length };
}

export function changeForWindow(
  n: NarrativeSnapshot,
  window: RotationWindow,
): number | null {
  if (window === "24h") return n.change24h;
  if (window === "30d") return n.change30d;
  return n.change7d;
}

export function narrativesForWindow(
  list: NarrativeSnapshot[],
  window: RotationWindow = DEFAULT_ROTATION_WINDOW,
): NarrativeView[] {
  return list.map((n) => {
    const change = changeForWindow(n, window);
    return {
      slug: n.slug,
      title: n.title,
      subtitle: n.subtitle,
      coingeckoCategoryId: n.coingeckoCategoryId,
      color: n.color,
      glowClass: n.glowClass,
      change,
      status: rotationStatusFromChange(change, window),
      sampleSize: n.sampleSize,
    };
  });
}

export function rankNarrativesForWindow(
  list: NarrativeSnapshot[],
  window: RotationWindow = DEFAULT_ROTATION_WINDOW,
): NarrativeView[] {
  return [...narrativesForWindow(list, window)].sort(
    (a, b) => (b.change ?? -999) - (a.change ?? -999),
  );
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function logLiveSnapshot(fields: Record<string, unknown>) {
  console.info("[dashboard] live snapshot", fields);
}

/** DISABLED — no CoinGecko /coins/categories. */
async function loadCategoryChangeMap(): Promise<{ map: Map<string, number>; status: number }> {
  return { map: new Map(), status: 0 };
}

async function fetchGlobalPulse(): Promise<MarketPulse> {
  return {
    totalMarketCapUsd: null,
    marketCapChange24h: null,
    totalVolumeUsd: null,
    btcDominance: null,
    ethDominance: null,
    btcDominanceChange: null,
    ethDominanceChange: null,
  };
}

async function fetchFearGreed(): Promise<number | null> {
  try {
    const res = await fetch("https://api.alternative.me/fng/?limit=1&format=json", {
      next: { revalidate: REVALIDATE },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    const first =
      data && typeof data === "object" && "data" in data && Array.isArray((data as { data: unknown }).data)
        ? (data as { data: Array<{ value?: string }> }).data[0]
        : null;
    const v = Number(first?.value ?? NaN);
    return Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}

function pickLowCaps(narrative: NarrativeDef, coins: CoinMarket[]): LowCapRow[] {
  const LOW_MAX = 250_000_000;
  const LOW_MIN = 2_000_000;
  return coins
    .filter((c) => {
      const m = c.market_cap;
      if (typeof c.id === "string" && c.id.startsWith("mock-")) return false;
      return m != null && m >= LOW_MIN && m <= LOW_MAX;
    })
    .slice(0, 4)
    .map((c, i) => {
      const ch = c.price_change_percentage_7d_in_currency ?? null;
      const spark = c.sparkline_in_7d?.price;
      return {
        id: c.id,
        name: c.name,
        symbol: c.symbol,
        image: c.image,
        marketCap: c.market_cap,
        change7d: ch,
        volume: c.total_volume,
        narrativeSlug: narrative.slug,
        narrativeTitle: narrative.title,
        narrativeColor: narrative.color,
        narrativeGlowClass: narrative.glowClass,
        status: rotationStatusFromChange(ch, "7d"),
        addedLabel: i === 0 ? "Today" : i === 1 ? "2d ago" : `${i + 1}d ago`,
        sparkline:
          Array.isArray(spark) && spark.length >= 2
            ? spark.filter((v): v is number => typeof v === "number" && Number.isFinite(v))
            : null,
      };
    });
}

function regimeDisplayLabel(
  regime: MarketRegime,
  narratives: NarrativeSnapshot[],
): string {
  const leading = narratives.filter((n) => n.status === "LEADING").length;
  const fading = narratives.filter((n) => n.status === "FADING").length;
  if (leading >= 1 && fading >= 1) return "ROTATION";
  if (regime === "Alt Season") return "ALT SEASON";
  if (regime === "Risk-On") return "RISK-ON";
  if (regime === "Risk-Off") return "RISK-OFF";
  return "ROTATION";
}

async function fetchTrendingAssets(_limit = 3): Promise<TrendingAssetRow[]> {
  // No CoinGecko /search/trending + /coins/markets — Dex movers cover this.
  return [];
}

async function loadNarrativeCategoryCoins(_categoryId: string): Promise<CoinMarket[]> {
  // No /coins/markets?category= — Dex lists only.
  return [];
}

export async function buildDashboardSnapshot(): Promise<DashboardSnapshot> {
  // Never call CoinGecko markets/categories/global. Callers should use mock or Dex.
  // Kept for type compatibility; returns a shell that `getDashboardSnapshot` no longer uses.
  const { getMockDashboardSnapshot } = await import("@/lib/dashboard-mock");
  return getMockDashboardSnapshot();
}
