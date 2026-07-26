import { NextResponse } from "next/server";
import { coinGeckoFetch } from "@/lib/coingecko";

const ALLOWED_DAYS = new Set(["1", "7", "14", "30", "90", "180", "365", "max"]);

/** CoinGecko OHLC candle: [timestamp, open, high, low, close] */
export type OhlcCandle = [number, number, number, number, number];

function parseOhlc(raw: unknown): OhlcCandle[] {
  if (!Array.isArray(raw)) return [];
  const out: OhlcCandle[] = [];
  for (const row of raw) {
    if (
      Array.isArray(row) &&
      row.length >= 5 &&
      typeof row[0] === "number" &&
      typeof row[1] === "number" &&
      typeof row[2] === "number" &&
      typeof row[3] === "number" &&
      typeof row[4] === "number" &&
      Number.isFinite(row[0]) &&
      Number.isFinite(row[1]) &&
      Number.isFinite(row[2]) &&
      Number.isFinite(row[3]) &&
      Number.isFinite(row[4])
    ) {
      out.push([row[0], row[1], row[2], row[3], row[4]]);
    }
  }
  return out;
}

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
      `/coins/${encodeURIComponent(id)}/ohlc?vs_currency=usd&days=${encodeURIComponent(days)}`,
      { next: { revalidate: 120 } },
    );
    if (!res.ok) {
      return NextResponse.json(
        { error: `CoinGecko chart failed (${res.status})` },
        { status: res.status === 404 ? 404 : 502 },
      );
    }
    const data: unknown = await res.json();
    const ohlc = parseOhlc(data);
    const prices = ohlc.map(([t, , , , c]) => [t, c] as [number, number]);

    return NextResponse.json({ id, days, ohlc, prices });
  } catch {
    return NextResponse.json({ error: "Chart unavailable" }, { status: 502 });
  }
}
