import { NextResponse } from "next/server";
import { coinGeckoFetch } from "@/lib/coingecko";

/** Fast movers board for the homepage (shorter cache than full markets bundle). */
export async function GET() {
  try {
    const res = await coinGeckoFetch(
      "/coins/markets?vs_currency=usd&order=volume_desc&per_page=40&page=1&sparkline=true&price_change_percentage=24h%2C1h",
      { next: { revalidate: 20 } },
    );
    if (!res.ok) {
      return NextResponse.json({ coins: [], error: `CoinGecko ${res.status}` }, { status: 502 });
    }
    const data: unknown = await res.json();
    const coins = Array.isArray(data) ? data : [];
    const sorted = [...coins].sort(
      (a, b) =>
        Math.abs(Number((b as { price_change_percentage_24h?: number }).price_change_percentage_24h) || 0) -
        Math.abs(Number((a as { price_change_percentage_24h?: number }).price_change_percentage_24h) || 0),
    );
    return NextResponse.json({
      coins: sorted.slice(0, 12),
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ coins: [], error: "Unavailable" }, { status: 502 });
  }
}
