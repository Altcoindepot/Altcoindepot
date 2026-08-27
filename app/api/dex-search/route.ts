import { NextResponse } from "next/server";
import { searchDexPairs } from "@/lib/dex-search";

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
    const items = await searchDexPairs(q, limit);
    return NextResponse.json(
      { items, q },
      {
        headers: {
          "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
        },
      },
    );
  } catch (err) {
    console.warn("[api/dex-search] failed", err);
    return NextResponse.json(
      { items: [], q, error: "Dex search unavailable" },
      { status: 200, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
