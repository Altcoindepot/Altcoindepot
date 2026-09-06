import { NextResponse } from "next/server";

/** Disabled — CoinGecko trending + markets burned Demo quota. */
export async function GET() {
  return NextResponse.json({ coins: [], disabled: true });
}
