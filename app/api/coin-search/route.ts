import { NextResponse } from "next/server";
import {
  getTopCoinsSearchIndex,
  searchTopCoinsIndex,
  TOP_COINS_SEARCH_LIMIT,
} from "@/lib/top-coins-index";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const limitRaw = Number(searchParams.get("limit") ?? "12");
  const limit = Number.isFinite(limitRaw) ? Math.min(30, Math.max(1, limitRaw)) : 12;

  if (!q) {
    return NextResponse.json({ coins: [], totalIndexed: 0 });
  }

  try {
    const index = await getTopCoinsSearchIndex();
    const coins = searchTopCoinsIndex(index, q, limit);
    return NextResponse.json({
      coins,
      totalIndexed: index.length,
      scope: TOP_COINS_SEARCH_LIMIT,
    });
  } catch {
    return NextResponse.json(
      { coins: [], totalIndexed: 0, error: "Search index unavailable" },
      { status: 503 },
    );
  }
}
