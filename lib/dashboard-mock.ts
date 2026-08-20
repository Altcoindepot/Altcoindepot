import type { DashboardSnapshot, LowCapRow, NarrativeSnapshot, TrendingAssetRow } from "@/lib/dashboard-data";
import { NARRATIVES, rotationStatusFromChange } from "@/lib/narratives";

/**
 * Hardcoded dashboard payload used when CoinGecko is rate-limited (429) or offline.
 * Keeps the homepage table + narrative diagram populated for visitors.
 */
const MOCK_CHANGES: ReadonlyArray<{
  change24h: number;
  change7d: number;
  change30d: number;
}> = [
  { change24h: 4.2, change7d: 11.5, change30d: 28.0 },
  { change24h: 1.8, change7d: 6.4, change30d: 14.2 },
  { change24h: 2.6, change7d: 8.1, change30d: 19.5 },
  { change24h: -0.8, change7d: 2.1, change30d: 5.4 },
  { change24h: 5.9, change7d: 15.2, change30d: 32.8 },
  { change24h: 0.4, change7d: 3.3, change30d: 9.7 },
];

const MOCK_LOW_CAP_NAMES: ReadonlyArray<{
  id: string;
  name: string;
  symbol: string;
  narrativeIndex: number;
  change7d: number;
  marketCap: number;
  volume: number;
}> = [
  {
    id: "mock-ai-1",
    name: "Agent Layer",
    symbol: "agnt",
    narrativeIndex: 0,
    change7d: 18.4,
    marketCap: 42_000_000,
    volume: 6_200_000,
  },
  {
    id: "mock-defi-1",
    name: "Yield Forge",
    symbol: "yfrg",
    narrativeIndex: 1,
    change7d: 12.1,
    marketCap: 88_000_000,
    volume: 11_400_000,
  },
  {
    id: "mock-rwa-1",
    name: "Tokenized Bills",
    symbol: "tbill",
    narrativeIndex: 2,
    change7d: 9.6,
    marketCap: 120_000_000,
    volume: 8_100_000,
  },
  {
    id: "mock-game-1",
    name: "Quest Chain",
    symbol: "qst",
    narrativeIndex: 3,
    change7d: 7.2,
    marketCap: 35_000_000,
    volume: 4_500_000,
  },
  {
    id: "mock-meme-1",
    name: "Depot Dog",
    symbol: "ddog",
    narrativeIndex: 4,
    change7d: 22.8,
    marketCap: 28_000_000,
    volume: 14_200_000,
  },
  {
    id: "mock-depin-1",
    name: "Mesh Nodes",
    symbol: "mesh",
    narrativeIndex: 5,
    change7d: 5.5,
    marketCap: 67_000_000,
    volume: 5_800_000,
  },
];

const MOCK_TRENDING: TrendingAssetRow[] = [
  {
    id: "bitcoin",
    name: "Bitcoin",
    symbol: "btc",
    image: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
    change24h: 1.4,
    volume: 28_500_000_000,
  },
  {
    id: "ethereum",
    name: "Ethereum",
    symbol: "eth",
    image: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
    change24h: 2.1,
    volume: 14_200_000_000,
  },
  {
    id: "solana",
    name: "Solana",
    symbol: "sol",
    image: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
    change24h: 3.6,
    volume: 4_800_000_000,
  },
];

export function getMockDashboardSnapshot(): DashboardSnapshot {
  const narratives: NarrativeSnapshot[] = NARRATIVES.map((def, i) => {
    const ch = MOCK_CHANGES[i] ?? MOCK_CHANGES[0]!;
    return {
      ...def,
      change24h: ch.change24h,
      change7d: ch.change7d,
      change30d: ch.change30d,
      status: rotationStatusFromChange(ch.change24h, "24h"),
      sampleSize: 12,
    };
  });

  const ranking = [...narratives].sort((a, b) => (b.change24h ?? 0) - (a.change24h ?? 0));
  const topRotations = ranking.slice(0, 4);

  const lowCaps: LowCapRow[] = MOCK_LOW_CAP_NAMES.map((row, i) => {
    const narrative = NARRATIVES[row.narrativeIndex] ?? NARRATIVES[0]!;
    return {
      id: row.id,
      name: row.name,
      symbol: row.symbol,
      image: "",
      marketCap: row.marketCap,
      change7d: row.change7d,
      volume: row.volume,
      priceUsd: Math.max(0.000001, row.marketCap / 1_000_000_000),
      liquidity: Math.round(row.volume * 0.35),
      chain: i % 2 === 0 ? "solana" : "base",
      dexId: i % 2 === 0 ? "raydium" : "uniswap",
      dexLabel: i % 2 === 0 ? "Raydium" : "Uniswap",
      narrativeSlug: narrative.slug,
      narrativeTitle: narrative.title,
      narrativeColor: narrative.color,
      narrativeGlowClass: narrative.glowClass,
      status: rotationStatusFromChange(row.change7d, "7d"),
      addedLabel: i === 0 ? "Today" : i === 1 ? "2d ago" : `${i + 1}d ago`,
      sparkline: [
        10,
        10 + row.change7d * 0.15,
        10 + row.change7d * 0.35,
        10 + row.change7d * 0.55,
        10 + row.change7d * 0.75,
        10 + row.change7d,
      ],
    };
  });

  return {
    narratives,
    ranking,
    topRotations,
    lowCaps,
    trendingAssets: MOCK_TRENDING,
    pulse: {
      totalMarketCapUsd: 2_450_000_000_000,
      marketCapChange24h: 1.2,
      totalVolumeUsd: 92_000_000_000,
      btcDominance: 52.4,
      ethDominance: 16.8,
      btcDominanceChange: null,
      ethDominanceChange: null,
    },
    regime: "Risk-On",
    regimeLabel: "ROTATION",
    regimeSummary:
      "Track narrative rotations, spot regime shifts, and move ahead of the crowd.",
    cycleDay: 12,
    cycleProgressPct: 48,
    updatedAt: new Date().toISOString(),
    stale: true,
    usingMock: true,
    usingStale: false,
  };
}
