import { NextResponse } from "next/server";
import { coinGeckoFetch } from "@/lib/coingecko";

type TrendingItem = {
  item?: {
    id?: string;
    name?: string;
    symbol?: string;
    market_cap_rank?: number | null;
    thumb?: string;
    small?: string;
  };
};

/**
 * CoinGecko search trending → enriched markets rows (price, 24h, sparkline).
 * Used by the homepage "Trending" section.
 */
export async function GET() {
  try {
    const trendRes = await coinGeckoFetch("/search/trending", {
      next: { revalidate: 3600 },
    });
    if (!trendRes.ok) {
      return NextResponse.json(
        { coins: [], error: `CoinGecko ${trendRes.status}` },
        { status: 502 },
      );
    }
    const trendData: unknown = await trendRes.json();
    const rawCoins =
      trendData && typeof trendData === "object" && "coins" in trendData
        ? (trendData as { coins: unknown }).coins
        : [];
    const ids: string[] = [];
    if (Array.isArray(rawCoins)) {
      for (const row of rawCoins as TrendingItem[]) {
        const id = row?.item?.id;
        if (typeof id === "string" && /^[a-z0-9_-]+$/i.test(id) && !ids.includes(id)) {
          ids.push(id);
        }
        if (ids.length >= 8) break;
      }
    }

    if (ids.length === 0) {
      return NextResponse.json({ coins: [], updatedAt: new Date().toISOString() });
    }

    const marketsRes = await coinGeckoFetch(
      `/coins/markets?vs_currency=usd&ids=${encodeURIComponent(ids.join(","))}&order=market_cap_desc&per_page=25&page=1&sparkline=true&price_change_percentage=24h%2C7d`,
      { next: { revalidate: 3600 } },
    );
    if (!marketsRes.ok) {
      return NextResponse.json(
        { coins: [], error: `CoinGecko ${marketsRes.status}` },
        { status: 502 },
      );
    }
    const markets: unknown = await marketsRes.json();
    const byId = new Map<string, Record<string, unknown>>();
    if (Array.isArray(markets)) {
      for (const row of markets) {
        if (row && typeof row === "object" && typeof (row as { id?: unknown }).id === "string") {
          byId.set((row as { id: string }).id, row as Record<string, unknown>);
        }
      }
    }

    const coins = ids
      .map((id, index) => {
        const m = byId.get(id);
        if (!m) return null;
        return {
          ...m,
          trending_rank: index + 1,
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      coins,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ coins: [], error: "Unavailable" }, { status: 502 });
  }
}
