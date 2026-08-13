import { NextResponse } from "next/server";
import { getTop200CoinsSearchIndex, TOP_200_SEARCH_LIMIT } from "@/lib/top-coins-index";

/** One-shot warm payload for client-side coin search (top 200 by market cap). */
export async function GET() {
  try {
    const coins = await getTop200CoinsSearchIndex();
    return NextResponse.json({
      coins,
      totalIndexed: coins.length,
      scope: TOP_200_SEARCH_LIMIT,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { coins: [], totalIndexed: 0, error: "Top 200 index unavailable" },
      { status: 503 },
    );
  }
}
