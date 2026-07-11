import { NextResponse } from "next/server";
import { getGlobalCryptoNewsCached } from "@/lib/coin-news";

export async function GET() {
  const { items, stale, cachedAt, sourceUrl } = await getGlobalCryptoNewsCached(8);
  return NextResponse.json(
    { items, stale, cachedAt, sourceUrl },
    {
      headers: {
        // Do not let browsers/CDN cache this route; freshness is controlled in `lib/coin-news.ts`.
        "Cache-Control": "private, no-store, max-age=0, must-revalidate",
      },
    },
  );
}
