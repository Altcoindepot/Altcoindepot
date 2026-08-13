import { unstable_cache } from "next/cache";
import { isProductionBuild } from "@/lib/build-phase";
import {
  coinGeckoFetch,
  loadMarketsByGeckoCategory,
  type CoinMarket,
} from "@/lib/coingecko";
import { PUBLIC_CATEGORIES, type PublicCategoryDef } from "@/lib/coin-categories";
import type { MarketPulse } from "@/lib/dashboard-data";

const REVALIDATE = 3600;

export type SectorMove = {
  slug: string;
  title: string;
  description: string;
  accentClass: string;
  coingeckoCategoryId: string;
  change24h: number | null;
  sampleSize: number;
};

export type OverviewCoin = {
  id: string;
  name: string;
  symbol: string;
  image: string;
  currentPrice: number | null;
  marketCap: number | null;
  volume: number | null;
  change24h: number | null;
  marketCapRank: number | null;
  /** Relative age label (e.g. "3d", "2mo", "1y"). */
  ageLabel: string | null;
  /** ISO date used for age (genesis or ATL fallback). */
  ageDate: string | null;
};

export type MarketOverviewSnapshot = {
  pulse: MarketPulse;
  sectors: SectorMove[];
  /** Strongest 24h movers among smaller-cap names (proxy for “new” activity). */
  newCoins: OverviewCoin[];
  updatedAt: string;
  stale: boolean;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function avg24h(coins: CoinMarket[]): { avg: number | null; n: number } {
  const vals = coins
    .map((c) => c.price_change_percentage_24h)
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v))
    .slice(0, 30);
  if (vals.length === 0) return { avg: null, n: 0 };
  return { avg: vals.reduce((a, b) => a + b, 0) / vals.length, n: vals.length };
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

async function sectorFromCategory(def: PublicCategoryDef): Promise<SectorMove> {
  let coins: CoinMarket[] = [];
  try {
    coins = await loadMarketsByGeckoCategory(def.coingeckoCategoryId, 40, {
      next: { revalidate: REVALIDATE },
    });
  } catch {
    coins = [];
  }
  const { avg, n } = avg24h(coins);
  return {
    slug: def.slug,
    title: def.title,
    description: def.description,
    accentClass: def.accentClass,
    coingeckoCategoryId: def.coingeckoCategoryId,
    change24h: avg,
    sampleSize: n,
  };
}

type MarketRow = CoinMarket & {
  market_cap_rank?: number | null;
  atl_date?: string | null;
};

/** Human-readable coin age from an ISO / YYYY-MM-DD date. */
export function formatCoinAge(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  const days = Math.max(0, Math.floor((Date.now() - t) / 86_400_000));
  if (days < 1) return "<1d";
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  const years = Math.floor(days / 365);
  const remMonths = Math.floor((days % 365) / 30);
  if (remMonths === 0) return `${years}y`;
  return `${years}y ${remMonths}mo`;
}

async function fetchGenesisDate(id: string): Promise<string | null> {
  try {
    const res = await coinGeckoFetch(
      `/coins/${encodeURIComponent(id)}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false`,
      { next: { revalidate: REVALIDATE } },
    );
    if (!res.ok) return null;
    const data: unknown = await res.json();
    if (!data || typeof data !== "object") return null;
    const genesis = (data as { genesis_date?: string | null }).genesis_date;
    return typeof genesis === "string" && genesis.length >= 8 ? genesis : null;
  } catch {
    return null;
  }
}

async function fetchSmallCapMovers(): Promise<OverviewCoin[]> {
  try {
    const res = await coinGeckoFetch(
      "/coins/markets?vs_currency=usd&order=volume_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h",
      { next: { revalidate: REVALIDATE } },
    );
    if (!res.ok) return [];
    const data: unknown = await res.json();
    if (!Array.isArray(data)) return [];
    const rows = data as MarketRow[];
    const SMALL_MAX = 150_000_000;
    const picked = rows
      .filter((c) => {
        const m = c.market_cap;
        const ch = c.price_change_percentage_24h;
        return (
          m != null &&
          m > 0 &&
          m <= SMALL_MAX &&
          typeof ch === "number" &&
          Number.isFinite(ch)
        );
      })
      .sort(
        (a, b) =>
          Math.abs(b.price_change_percentage_24h ?? 0) -
          Math.abs(a.price_change_percentage_24h ?? 0),
      )
      .slice(0, 12);

    const out: OverviewCoin[] = [];
    for (let i = 0; i < picked.length; i++) {
      const c = picked[i]!;
      if (i > 0) await sleep(120);
      const genesis = await fetchGenesisDate(c.id);
      const ageDate = genesis ?? (typeof c.atl_date === "string" ? c.atl_date : null);
      out.push({
        id: c.id,
        name: c.name,
        symbol: c.symbol,
        image: c.image,
        currentPrice: c.current_price,
        marketCap: c.market_cap,
        volume: c.total_volume,
        change24h: c.price_change_percentage_24h,
        marketCapRank: c.market_cap_rank ?? null,
        ageDate,
        ageLabel: formatCoinAge(ageDate),
      });
    }
    return out;
  } catch {
    return [];
  }
}

async function buildMarketOverview(): Promise<MarketOverviewSnapshot> {
  const pulse = await fetchGlobalPulse();
  const sectors: SectorMove[] = [];
  for (let i = 0; i < PUBLIC_CATEGORIES.length; i++) {
    if (i > 0) await sleep(160);
    sectors.push(await sectorFromCategory(PUBLIC_CATEGORIES[i]!));
  }
  sectors.sort((a, b) => (b.change24h ?? -999) - (a.change24h ?? -999));
  const newCoins = await fetchSmallCapMovers();
  return {
    pulse,
    sectors,
    newCoins,
    updatedAt: new Date().toISOString(),
    stale: sectors.every((s) => s.sampleSize === 0),
  };
}

const getCachedMarketOverviewSnapshot = unstable_cache(
  buildMarketOverview,
  ["market-overview-v2-ages"],
  { revalidate: REVALIDATE },
);

export async function getMarketOverviewSnapshot(): Promise<MarketOverviewSnapshot> {
  if (isProductionBuild()) {
    return {
      pulse: {
        totalMarketCapUsd: null,
        marketCapChange24h: null,
        totalVolumeUsd: null,
        btcDominance: null,
        ethDominance: null,
        btcDominanceChange: null,
        ethDominanceChange: null,
      },
      sectors: [],
      newCoins: [],
      updatedAt: new Date().toISOString(),
      stale: true,
    };
  }
  return getCachedMarketOverviewSnapshot();
}

/** Map change % to a heatmap cell background. */
export function sectorHeatStyle(change: number | null): {
  backgroundColor: string;
  color: string;
} {
  if (change == null || !Number.isFinite(change)) {
    return { backgroundColor: "rgba(39,39,42,0.8)", color: "#a1a1aa" };
  }
  const intensity = Math.min(1, Math.abs(change) / 12);
  if (change >= 0) {
    return {
      backgroundColor: `rgba(16, 185, 129, ${0.12 + intensity * 0.55})`,
      color: intensity > 0.45 ? "#ecfdf5" : "#a7f3d0",
    };
  }
  return {
    backgroundColor: `rgba(248, 113, 113, ${0.12 + intensity * 0.55})`,
    color: intensity > 0.45 ? "#fef2f2" : "#fecaca",
  };
}
