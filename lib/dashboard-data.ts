import { unstable_cache } from "next/cache";
import { isProductionBuild } from "@/lib/build-phase";
import {
  CoinGeckoRateLimitError,
  coinGeckoFetch,
  loadMarketsByGeckoCategory,
  type CoinMarket,
} from "@/lib/coingecko";
import { getMockDashboardSnapshot } from "@/lib/dashboard-mock";
import { computeMarketRegime, type MarketRegime } from "@/lib/market-regime";
import {
  DEFAULT_ROTATION_WINDOW,
  NARRATIVES,
  rotationStatusFromChange,
  type NarrativeDef,
  type NarrativeStatus,
  type RotationWindow,
} from "@/lib/narratives";

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
  change7d: number | null;
  volume: number | null;
  narrativeSlug: string;
  narrativeTitle: string;
  narrativeColor: string;
  narrativeGlowClass: string;
  status: NarrativeStatus;
  /** Relative “added” label (best-effort from rank within basket). */
  addedLabel: string;
  /** Optional 7d sparkline prices from CoinGecko. */
  sparkline?: number[] | null;
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

async function fetchGlobalPulse(): Promise<MarketPulse> {
  try {
    const res = await coinGeckoFetch("/global", { next: { revalidate: REVALIDATE } });
    if (!res.ok) throw new Error(String(res.status));
    const json: unknown = await res.json();
    const data =
      json && typeof json === "object" && "data" in json
        ? (json as { data: Record<string, unknown> }).data
        : null;
    const mcap =
      data?.total_market_cap && typeof data.total_market_cap === "object"
        ? Number((data.total_market_cap as { usd?: number }).usd ?? NaN)
        : NaN;
    const vol =
      data?.total_volume && typeof data.total_volume === "object"
        ? Number((data.total_volume as { usd?: number }).usd ?? NaN)
        : NaN;
    const mcapCh = Number(data?.market_cap_change_percentage_24h_usd ?? NaN);
    const btcDom = Number(
      data?.market_cap_percentage && typeof data.market_cap_percentage === "object"
        ? (data.market_cap_percentage as { btc?: number }).btc
        : NaN,
    );
    const ethDom = Number(
      data?.market_cap_percentage && typeof data.market_cap_percentage === "object"
        ? (data.market_cap_percentage as { eth?: number }).eth
        : NaN,
    );
    return {
      totalMarketCapUsd: Number.isFinite(mcap) ? mcap : null,
      marketCapChange24h: Number.isFinite(mcapCh) ? mcapCh : null,
      totalVolumeUsd: Number.isFinite(vol) ? vol : null,
      btcDominance: Number.isFinite(btcDom) ? btcDom : null,
      ethDominance: Number.isFinite(ethDom) ? ethDom : null,
      btcDominanceChange: null,
      ethDominanceChange: null,
    };
  } catch {
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

async function fetchTrendingAssets(limit = 3): Promise<TrendingAssetRow[]> {
  try {
    const trendRes = await coinGeckoFetch("/search/trending", {
      next: { revalidate: REVALIDATE },
    });
    if (!trendRes.ok) return [];
    const trendData: unknown = await trendRes.json();
    const rawCoins =
      trendData && typeof trendData === "object" && "coins" in trendData
        ? (trendData as { coins: unknown }).coins
        : [];
    const ids: string[] = [];
    if (Array.isArray(rawCoins)) {
      for (const row of rawCoins as Array<{ item?: { id?: string } }>) {
        const id = row?.item?.id;
        if (typeof id === "string" && /^[a-z0-9_-]+$/i.test(id) && !ids.includes(id)) {
          ids.push(id);
        }
        if (ids.length >= limit) break;
      }
    }
    if (ids.length === 0) return [];

    const marketsRes = await coinGeckoFetch(
      `/coins/markets?vs_currency=usd&ids=${encodeURIComponent(ids.join(","))}&order=market_cap_desc&per_page=25&page=1&sparkline=false&price_change_percentage=24h`,
      { next: { revalidate: REVALIDATE } },
    );
    if (!marketsRes.ok) return [];
    const markets: unknown = await marketsRes.json();
    const byId = new Map<string, CoinMarket>();
    if (Array.isArray(markets)) {
      for (const row of markets) {
        if (row && typeof row === "object" && typeof (row as CoinMarket).id === "string") {
          byId.set((row as CoinMarket).id, row as CoinMarket);
        }
      }
    }

    return ids
      .map((id) => {
        const m = byId.get(id);
        if (!m) return null;
        return {
          id: m.id,
          name: m.name,
          symbol: m.symbol,
          image: m.image ?? "",
          change24h: m.price_change_percentage_24h ?? null,
          volume: m.total_volume ?? null,
        } satisfies TrendingAssetRow;
      })
      .filter((row): row is TrendingAssetRow => row != null)
      .slice(0, limit);
  } catch {
    return [];
  }
}

async function loadNarrativeCategoryCoins(categoryId: string): Promise<CoinMarket[]> {
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await sleep(400 * attempt + 250);
    try {
      return await loadMarketsByGeckoCategory(
        categoryId,
        40,
        { next: { revalidate: REVALIDATE } },
        { sparkline: false },
      );
    } catch (err) {
      const rateLimited = err instanceof CoinGeckoRateLimitError;
      if (rateLimited && attempt < 2) continue;
      return [];
    }
  }
  return [];
}

async function buildDashboardSnapshot(): Promise<DashboardSnapshot> {
  const narratives: NarrativeSnapshot[] = [];
  const lowCapPool: LowCapRow[] = [];
  let btcChange24h: number | null = null;

  for (let i = 0; i < NARRATIVES.length; i++) {
    const def = NARRATIVES[i]!;
    if (i > 0) await sleep(280);
    const coins = await loadNarrativeCategoryCoins(def.coingeckoCategoryId);
    const a24 = avgField(coins, (c) => c.price_change_percentage_24h);
    const a7 = avgField(coins, (c) => c.price_change_percentage_7d_in_currency);
    const a30 = avgField(coins, (c) => c.price_change_percentage_30d_in_currency);
    const sampleSize = Math.max(a24.n, a7.n, a30.n);
    narratives.push({
      ...def,
      change24h: a24.avg,
      change7d: a7.avg,
      change30d: a30.avg,
      status: rotationStatusFromChange(a24.avg, "24h"),
      sampleSize,
    });
    lowCapPool.push(...pickLowCaps(def, coins));
  }

  try {
    const res = await coinGeckoFetch(
      "/coins/markets?vs_currency=usd&ids=bitcoin&sparkline=false&price_change_percentage=24h",
      { next: { revalidate: REVALIDATE } },
    );
    if (res.ok) {
      const data: unknown = await res.json();
      if (Array.isArray(data) && data[0] && typeof data[0] === "object") {
        const ch = (data[0] as { price_change_percentage_24h?: number }).price_change_percentage_24h;
        if (typeof ch === "number") btcChange24h = ch;
      }
    }
  } catch {
    /* ignore soft failures — BTC quote is optional for regime */
  }

  const [pulse, fearGreed, trendingAssets] = await Promise.all([
    fetchGlobalPulse(),
    fetchFearGreed(),
    fetchTrendingAssets(3),
  ]);

  const outperformShare =
    narratives.filter((n) => (n.change24h ?? 0) > (btcChange24h ?? 0)).length /
    Math.max(narratives.length, 1);
  const altSeasonIndex = outperformShare * 100;

  const regimeResult = computeMarketRegime({
    fearGreed,
    altSeasonIndex,
    btcChange24h,
    marketCapChange24h: pulse.marketCapChange24h,
  });

  const ranking = [...narratives].sort((a, b) => (b.change24h ?? -999) - (a.change24h ?? -999));
  const topRotations = ranking.slice(0, 4);
  const lowCaps = [...lowCapPool]
    .sort((a, b) => (b.change7d ?? -999) - (a.change7d ?? -999))
    .slice(0, 8);

  const leadCount = narratives.filter((n) => n.status === "LEADING").length;
  const cycleProgressPct = Math.round(
    Math.min(95, Math.max(8, (leadCount / Math.max(narratives.length, 1)) * 55 + 20)),
  );
  const dayOfYear = Math.floor(
    (Date.now() - Date.UTC(new Date().getUTCFullYear(), 0, 0)) / 86_400_000,
  );
  const cycleDay = (dayOfYear % 28) + 1;

  const loadedCount = narratives.filter((n) => n.sampleSize > 0).length;
  if (loadedCount === 0) {
    // Treat a fully empty live response as unavailable so callers can fall back to mocks.
    throw new Error("CoinGecko dashboard returned empty category payloads");
  }

  return {
    narratives,
    ranking,
    topRotations,
    lowCaps,
    trendingAssets,
    pulse,
    regime: regimeResult.regime,
    regimeLabel: regimeDisplayLabel(regimeResult.regime, narratives),
    regimeSummary: regimeResult.summary,
    cycleDay,
    cycleProgressPct,
    updatedAt: new Date().toISOString(),
    stale: loadedCount < narratives.length,
    usingMock: false,
  };
}

const getCachedDashboardSnapshot = unstable_cache(
  buildDashboardSnapshot,
  ["dashboard-snapshot-v6-hourly"],
  { revalidate: REVALIDATE },
);

/**
 * Server-only homepage loader: cached CoinGecko snapshot with mock fallback on
 * rate limits (429), network failures, or empty payloads.
 */
export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  if (isProductionBuild()) {
    return getMockDashboardSnapshot();
  }
  try {
    return await getCachedDashboardSnapshot();
  } catch (err) {
    console.error("[dashboard] CoinGecko fetch failed; using mock snapshot.", err);
    return getMockDashboardSnapshot();
  }
}
