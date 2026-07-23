import { NextResponse } from "next/server";
import { coinGeckoFetch } from "@/lib/coingecko";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idsRaw = searchParams.get("ids")?.trim() ?? "";
  const ids = [
    ...new Set(
      idsRaw
        .split(",")
        .map((id) => id.trim().toLowerCase())
        .filter((id) => /^[a-z0-9_-]+$/i.test(id)),
    ),
  ].slice(0, 50);

  if (ids.length === 0) {
    return NextResponse.json({ coins: [] });
  }

  try {
    const res = await coinGeckoFetch(
      `/coins/markets?vs_currency=usd&ids=${encodeURIComponent(ids.join(","))}&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h%2C7d`,
      { next: { revalidate: 30 } },
    );
    if (!res.ok) {
      return NextResponse.json({ coins: [], error: `CoinGecko ${res.status}` }, { status: 502 });
    }
    const data: unknown = await res.json();
    return NextResponse.json({ coins: Array.isArray(data) ? data : [] });
  } catch {
    return NextResponse.json({ coins: [], error: "Unavailable" }, { status: 502 });
  }
}
