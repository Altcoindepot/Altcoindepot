import { NextResponse } from "next/server";

/** Disabled — CoinGecko markets+sparkline burned Demo quota. Home uses Dex movers. */
export async function GET() {
  return NextResponse.json({ movers: [], disabled: true });
}
