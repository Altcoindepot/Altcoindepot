import { NextResponse } from "next/server";
import { getCoinById } from "@/lib/coingecko";
import { resolveProjectTwitterHandle } from "@/lib/ecosystem-projects";
import { getLatestXTweetsCached } from "@/lib/x-feed";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = (searchParams.get("id") ?? "").trim().toLowerCase();
    if (!id) {
      return NextResponse.json({ tweets: [] });
    }

    const coin = await getCoinById(id);
    const handle = coin ? resolveProjectTwitterHandle(coin) : undefined;
    if (!handle) {
      return NextResponse.json({ tweets: [], stale: false, cachedAt: null });
    }

    const { tweets, stale, cachedAt } = await getLatestXTweetsCached(handle, 5);
    return NextResponse.json(
      { tweets, stale, cachedAt },
      { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=120" } },
    );
  } catch {
    return NextResponse.json(
      { tweets: [], stale: true, cachedAt: null },
      { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=120" } },
    );
  }
}
