import { NextResponse } from "next/server";

/**
 * Related-coins used to fan out `/coins/markets` (100 rows) per coin page.
 * Disabled to protect CoinGecko Demo quota — return empty; Dex/search cover discovery.
 */
export async function GET() {
  return NextResponse.json({ coins: [], disabled: true });
}
