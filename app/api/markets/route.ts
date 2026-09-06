import { NextResponse } from "next/server";

/** Disabled — `loadMarketsBundle` was a CoinGecko markets fan-out. */
export async function GET() {
  return NextResponse.json({ disabled: true, error: "Markets API disabled" }, { status: 410 });
}
