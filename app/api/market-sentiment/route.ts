import { NextResponse } from "next/server";

async function fetchCoinGeckoGlobal() {
  const res = await fetch("https://api.coingecko.com/api/v3/global", {
    next: { revalidate: 120 },
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`CoinGecko global failed (${res.status})`);
  const data = await res.json();
  return {
    totalMarketCapUsd: Number(data?.data?.total_market_cap?.usd ?? 0),
    marketCap24hChangePct: Number(data?.data?.market_cap_change_percentage_24h_usd ?? 0),
  };
}

async function fetchFearGreed() {
  const res = await fetch("https://api.alternative.me/fng/?limit=1&format=json", {
    next: { revalidate: 600 },
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Fear & Greed failed (${res.status})`);
  const data = await res.json();
  const first = Array.isArray(data?.data) ? data.data[0] : null;
  return {
    value: Number(first?.value ?? 0),
    label: typeof first?.value_classification === "string" ? first.value_classification : "Unknown",
    timestamp: Number(first?.timestamp ?? 0),
    timeUntilUpdateSec: Number(first?.time_until_update ?? 0),
  };
}

export async function GET() {
  try {
    const [global, fearGreed] = await Promise.all([fetchCoinGeckoGlobal(), fetchFearGreed()]);
    return NextResponse.json({ ...global, fearGreed });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load sentiment trackers",
      },
      { status: 502 },
    );
  }
}
