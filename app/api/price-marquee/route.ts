import { NextResponse } from "next/server";
import { getChainMovers, pickHomeTopMovers } from "@/lib/dex-chain-movers";

/** Dex-backed ticker strip — no CoinGecko /coins/markets. */
export async function GET() {
  try {
    const boards = await getChainMovers();
    const rows = pickHomeTopMovers(boards, 12);
    const items = rows.map((r) => ({
      id: r.id,
      symbol: r.symbol,
      name: r.name,
      imageUrl: r.imageUrl ?? null,
      priceUsd: r.priceUsd,
      changePct: r.changePct,
    }));
    return NextResponse.json(
      { items },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (err) {
    console.warn("[api/price-marquee] failed", err);
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}
