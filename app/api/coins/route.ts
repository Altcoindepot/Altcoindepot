import { NextResponse } from "next/server";

/**
 * Formerly `/coins/markets?ids=` live quotes for watchlist/portfolio.
 * Disabled — live price is Dex-only; protects CoinGecko Demo quota.
 */
export async function GET() {
  return NextResponse.json({ coins: [], disabled: true });
}
