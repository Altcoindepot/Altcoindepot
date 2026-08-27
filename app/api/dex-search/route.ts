import { NextResponse } from "next/server";
import { searchUniverse } from "@/lib/universe-search";

/** Hybrid search: cached ~7k index + Dex contracts/prices. No Gecko per keystroke. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const limitRaw = Number(searchParams.get("limit") ?? "10");
  const limit = Number.isFinite(limitRaw) ? Math.min(12, Math.max(1, Math.floor(limitRaw))) : 10;

  if (q.length < 1) {
    return NextResponse.json(
      { items: [], q: "" },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  }

  try {
    const items = await searchUniverse(q, limit);
    return NextResponse.json(
      { items, q },
      {
        headers: {
          "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
        },
      },
    );
  } catch (err) {
    console.warn("[api/dex-search] universe search failed", err);
    return NextResponse.json(
      { items: [], q, error: "Search unavailable" },
      { status: 200, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
