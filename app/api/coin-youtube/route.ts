import { NextResponse } from "next/server";
import { getCoinById } from "@/lib/coingecko";
import { getYoutubeVideosForCoinCached } from "@/lib/youtube-feed";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = (searchParams.get("id") ?? "").trim().toLowerCase();
    if (!id) {
      return NextResponse.json({
        videos: [],
        sourceHint: null,
        stale: false,
        cachedAt: null,
      });
    }

    const coin = await getCoinById(id);
    if (!coin) {
      return NextResponse.json({
        videos: [],
        sourceHint: null,
        stale: false,
        cachedAt: null,
      });
    }

    const { videos, sourceHint, stale, cachedAt } = await getYoutubeVideosForCoinCached(coin, 5);
    return NextResponse.json(
      { videos, sourceHint, stale, cachedAt },
      {
        headers: {
          "Cache-Control": "private, s-maxage=120, stale-while-revalidate=300",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { videos: [], sourceHint: null, stale: true, cachedAt: null },
      {
        headers: {
          "Cache-Control": "private, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  }
}
