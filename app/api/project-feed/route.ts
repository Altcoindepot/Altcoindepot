import { NextResponse } from "next/server";
import { getFeaturedCoinFeed } from "@/lib/featured-coin-feed";

export async function GET() {
  const updates = await getFeaturedCoinFeed();
  return NextResponse.json(
    { updates },
    { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=120" } },
  );
}
