import { unstable_cache } from "next/cache";
import { isProductionBuild } from "@/lib/build-phase";
import { PUBLIC_CATEGORIES } from "@/lib/coin-categories";
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
  ageLabel: string | null;
  ageDate: string | null;
};

export type MarketOverviewSnapshot = {
  pulse: MarketPulse;
  sectors: SectorMove[];
  newCoins: OverviewCoin[];
  updatedAt: string;
  stale: boolean;
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

async function buildMarketOverview(): Promise<MarketOverviewSnapshot> {
  // No CoinGecko /global or /coins/markets — Dex covers live lists.
  const pulse: MarketPulse = {
    totalMarketCapUsd: null,
    marketCapChange24h: null,
    totalVolumeUsd: null,
    btcDominance: null,
    ethDominance: null,
    btcDominanceChange: null,
    ethDominanceChange: null,
  };
  const sectors: SectorMove[] = PUBLIC_CATEGORIES.map((def) => ({
    slug: def.slug,
    title: def.title,
    description: def.description,
    accentClass: def.accentClass,
    coingeckoCategoryId: def.coingeckoCategoryId,
    change24h: null,
    sampleSize: 0,
  }));
  return {
    pulse,
    sectors,
    newCoins: [],
    updatedAt: new Date().toISOString(),
    stale: true,
  };
}

const getCachedMarketOverviewSnapshot = unstable_cache(
  buildMarketOverview,
  ["market-overview-v3-nomarkets"],
  { revalidate: REVALIDATE },
);

export async function getMarketOverviewSnapshot(): Promise<MarketOverviewSnapshot> {
  if (isProductionBuild()) {
    return buildMarketOverview();
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
