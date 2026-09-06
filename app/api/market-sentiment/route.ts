import { NextResponse } from "next/server";
import { MARKET_SENTIMENT_SNAPSHOT } from "@/lib/market-sentiment";

async function fetchFearGreed() {
  const res = await fetch("https://api.alternative.me/fng/?limit=1&format=json", {
    next: { revalidate: 3600 },
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Fear & Greed failed (${res.status})`);
  const data = await res.json();
  const first = Array.isArray(data?.data) ? data.data[0] : null;
  return {
    value: Number(first?.value ?? MARKET_SENTIMENT_SNAPSHOT.fearAndGreedValue),
    label:
      typeof first?.value_classification === "string"
        ? first.value_classification
        : "Unknown",
    timestamp: Number(first?.timestamp ?? 0),
    timeUntilUpdateSec: Number(first?.time_until_update ?? 0),
  };
}

/**
 * Sentiment strip — Alternative.me Fear & Greed only.
 * No CoinGecko /global (home + this route must not burn Demo quota).
 */
export async function GET() {
  try {
    const fearGreed = await fetchFearGreed();
    return NextResponse.json({
      fearGreed,
      altseasonProgress: MARKET_SENTIMENT_SNAPSHOT.altseasonProgress,
      totalMarketCapUsd: null,
      marketCap24hChangePct: null,
      gecko: false,
    });
  } catch {
    return NextResponse.json({
      fearGreed: {
        value: MARKET_SENTIMENT_SNAPSHOT.fearAndGreedValue,
        label: "Unknown",
        timestamp: 0,
        timeUntilUpdateSec: 0,
      },
      altseasonProgress: MARKET_SENTIMENT_SNAPSHOT.altseasonProgress,
      totalMarketCapUsd: null,
      marketCap24hChangePct: null,
      gecko: false,
    });
  }
}
