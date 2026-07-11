import { coinGeckoHeaders } from "@/lib/coingecko";

const CG = "https://api.coingecko.com/api/v3";

export type CoinSearchHit = {
  id: string;
  name: string;
  symbol: string;
  market_cap_rank?: number | null;
};

export type CoinSearchResponse = {
  coins?: CoinSearchHit[];
};

export async function searchCoins(
  query: string,
  init?: RequestInit & { next?: { revalidate?: number } },
): Promise<CoinSearchHit[]> {
  const q = query.trim();
  if (!q) return [];
  const res = await fetch(`${CG}/search?query=${encodeURIComponent(q)}`, {
    ...init,
    headers: { Accept: "application/json", ...coinGeckoHeaders(), ...init?.headers },
  });
  if (!res.ok) throw new Error(`CoinGecko search error: ${res.status}`);
  const data = (await res.json()) as CoinSearchResponse;
  return data.coins ?? [];
}

export type CoinDetailStats = {
  id: string;
  name: string;
  symbol: string;
  image: string;
  marketCapRank: number | null;
  athUsd: number | null;
  athDate: string | null;
  atlUsd: number | null;
  atlDate: string | null;
  totalVolume24hUsd: number | null;
  /** Latest hourly bucket from 1d chart (approx. past hour volume, USD). */
  volume1hUsd: number | null;
  twitterHandle: string | null;
};

type CoinDetailJson = {
  id: string;
  name: string;
  symbol: string;
  image?: { large?: string; small?: string };
  links?: { twitter_screen_name?: string };
  market_data?: {
    market_cap_rank?: number | null;
    ath?: { usd?: number };
    ath_date?: { usd?: string };
    atl?: { usd?: number };
    atl_date?: { usd?: string };
    total_volume?: { usd?: number };
  };
};

type MarketChartJson = {
  total_volumes?: [number, number][];
};

export async function loadCoinDetailStats(
  id: string,
  init?: RequestInit & { next?: { revalidate?: number } },
): Promise<CoinDetailStats | null> {
  const detailUrl = `${CG}/coins/${encodeURIComponent(
    id,
  )}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;

  const [detailRes, chartRes] = await Promise.all([
    fetch(detailUrl, {
      ...init,
      headers: { Accept: "application/json", ...init?.headers },
    }),
    fetch(
      `${CG}/coins/${encodeURIComponent(id)}/market_chart?vs_currency=usd&days=1`,
      {
        ...init,
        headers: { Accept: "application/json", ...init?.headers },
      },
    ),
  ]);

  if (!detailRes.ok) {
    if (detailRes.status === 404) return null;
    throw new Error(`CoinGecko coin error: ${detailRes.status}`);
  }

  const raw = (await detailRes.json()) as CoinDetailJson;
  const md = raw.market_data;

  let volume1hUsd: number | null = null;
  if (chartRes.ok) {
    const chart = (await chartRes.json()) as MarketChartJson;
    const vols = chart.total_volumes;
    if (vols && vols.length > 0) {
      const last = vols[vols.length - 1];
      if (last && typeof last[1] === "number" && !Number.isNaN(last[1])) {
        volume1hUsd = last[1];
      }
    }
  }

  const tw = raw.links?.twitter_screen_name?.replace(/^@/, "").trim();

  return {
    id: raw.id,
    name: raw.name,
    symbol: raw.symbol,
    image: raw.image?.large ?? raw.image?.small ?? "",
    marketCapRank:
      md?.market_cap_rank != null && !Number.isNaN(md.market_cap_rank)
        ? md.market_cap_rank
        : null,
    athUsd: md?.ath?.usd ?? null,
    athDate: md?.ath_date?.usd ?? null,
    atlUsd: md?.atl?.usd ?? null,
    atlDate: md?.atl_date?.usd ?? null,
    totalVolume24hUsd: md?.total_volume?.usd ?? null,
    volume1hUsd,
    twitterHandle: tw && tw.length > 0 ? tw : null,
  };
}
