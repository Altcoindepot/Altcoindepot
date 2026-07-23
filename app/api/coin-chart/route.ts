import { NextResponse } from "next/server";
import { coinGeckoFetch } from "@/lib/coingecko";

const ALLOWED_DAYS = new Set(["1", "7", "14", "30", "90", "180", "365", "max"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id")?.trim().toLowerCase() ?? "";
  const daysRaw = searchParams.get("days")?.trim() ?? "7";
  const days = ALLOWED_DAYS.has(daysRaw) ? daysRaw : "7";

  if (!id || !/^[a-z0-9_-]+$/i.test(id)) {
    return NextResponse.json({ error: "Invalid coin id" }, { status: 400 });
  }

  try {
    const res = await coinGeckoFetch(
      `/coins/${encodeURIComponent(id)}/market_chart?vs_currency=usd&days=${encodeURIComponent(days)}`,
      { next: { revalidate: 120 } },
    );
    if (!res.ok) {
      return NextResponse.json(
        { error: `CoinGecko chart failed (${res.status})` },
        { status: res.status === 404 ? 404 : 502 },
      );
    }
    const data = (await res.json()) as { prices?: [number, number][] };
    const prices = Array.isArray(data.prices)
      ? data.prices
          .filter(
            (p): p is [number, number] =>
              Array.isArray(p) &&
              p.length >= 2 &&
              typeof p[0] === "number" &&
              typeof p[1] === "number" &&
              Number.isFinite(p[0]) &&
              Number.isFinite(p[1]),
          )
          .map(([t, v]) => [t, v] as [number, number])
      : [];

    return NextResponse.json({ id, days, prices });
  } catch {
    return NextResponse.json({ error: "Chart unavailable" }, { status: 502 });
  }
}
