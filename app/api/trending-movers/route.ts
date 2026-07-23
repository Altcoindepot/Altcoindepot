import { NextResponse } from "next/server";
import { coinGeckoFetch } from "@/lib/coingecko";

type MarketRow = {
  id?: string;
  price_change_percentage_24h?: number | null;
  total_volume?: number | null;
};

function pct24(c: MarketRow): number {
  const v = c.price_change_percentage_24h;
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function volume(c: MarketRow): number {
  const v = c.total_volume;
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

/** Fast gainers/losers board from high-volume coins (short cache). */
export async function GET() {
  try {
    const res = await coinGeckoFetch(
      "/coins/markets?vs_currency=usd&order=volume_desc&per_page=80&page=1&sparkline=true&price_change_percentage=24h%2C1h",
      { next: { revalidate: 20 } },
    );
    if (!res.ok) {
      return NextResponse.json(
        { gainers: [], losers: [], coins: [], error: `CoinGecko ${res.status}` },
        { status: 502 },
      );
    }
    const data: unknown = await res.json();
    const coins = (Array.isArray(data) ? data : []) as MarketRow[];

    // Prefer liquid names so tiny illiquid pumps don't dominate.
    const liquid = coins.filter((c) => volume(c) > 0 && typeof c.id === "string");

    const gainers = [...liquid]
      .filter((c) => pct24(c) > 0)
      .sort((a, b) => pct24(b) - pct24(a) || volume(b) - volume(a))
      .slice(0, 6);

    const losers = [...liquid]
      .filter((c) => pct24(c) < 0)
      .sort((a, b) => pct24(a) - pct24(b) || volume(b) - volume(a))
      .slice(0, 6);

    const updatedAt = new Date().toISOString();

    return NextResponse.json({
      gainers,
      losers,
      /** @deprecated kept for older clients */
      coins: [...gainers, ...losers],
      updatedAt,
    });
  } catch {
    return NextResponse.json(
      { gainers: [], losers: [], coins: [], error: "Unavailable" },
      { status: 502 },
    );
  }
}
