import { NextResponse } from "next/server";
import { coinGeckoFetch } from "@/lib/coingecko";

/** Nearby market-cap peers for “related coins” on detail pages. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = (searchParams.get("id") ?? "").trim().toLowerCase();
  if (!id || !/^[a-z0-9_-]+$/i.test(id)) {
    return NextResponse.json({ coins: [] });
  }

  try {
    const res = await coinGeckoFetch(
      "/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h",
      { next: { revalidate: 90 } },
    );
    if (!res.ok) {
      return NextResponse.json({ coins: [], error: `CoinGecko ${res.status}` }, { status: 502 });
    }
    const data: unknown = await res.json();
    const markets = Array.isArray(data) ? data : [];
    const idx = markets.findIndex(
      (c) => c && typeof c === "object" && (c as { id?: string }).id === id,
    );

    let peers: unknown[] = [];
    if (idx >= 0) {
      const start = Math.max(0, idx - 4);
      const end = Math.min(markets.length, start + 9);
      peers = markets.slice(start, end).filter((c) => (c as { id?: string }).id !== id);
    } else {
      peers = markets.slice(0, 8).filter((c) => (c as { id?: string }).id !== id);
    }

    return NextResponse.json({ coins: peers.slice(0, 6) });
  } catch {
    return NextResponse.json({ coins: [], error: "Unavailable" }, { status: 502 });
  }
}
