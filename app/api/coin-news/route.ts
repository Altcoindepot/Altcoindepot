import { NextResponse } from "next/server";
import { getCoinNewsCachedById } from "@/lib/coin-news";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = (searchParams.get("id") ?? "").trim().toLowerCase();
    if (!id) {
      return NextResponse.json({ items: [], stale: false, cachedAt: null, sourceUrl: "" });
    }

    const { items, stale, cachedAt, sourceUrl } = await getCoinNewsCachedById(id, 4);
    return NextResponse.json(
      { items, stale, cachedAt, sourceUrl },
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0, must-revalidate",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { items: [], stale: true, cachedAt: null, sourceUrl: "" },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-store, max-age=0, must-revalidate",
        },
      },
    );
  }
}
