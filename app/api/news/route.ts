import { NextResponse } from "next/server";
import { getSiteNewsCached } from "@/lib/site-news";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = Number(searchParams.get("limit") ?? "12");
  const limit = Number.isFinite(raw) ? Math.min(40, Math.max(1, Math.floor(raw))) : 12;

  try {
    const news = await getSiteNewsCached(limit);
    return NextResponse.json(
      {
        items: news.items,
        stale: news.stale,
        cachedAt: news.cachedAt,
        sourcesSucceeded: news.sourcesSucceeded,
        sourcesLabel: news.sourcesLabel,
      },
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0, must-revalidate",
        },
      },
    );
  } catch (err) {
    console.warn("[api/news] failed", err);
    return NextResponse.json(
      {
        items: [],
        stale: true,
        cachedAt: null,
        sourcesSucceeded: [],
        sourcesLabel: "Headlines from major crypto outlets",
      },
      { status: 200, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
