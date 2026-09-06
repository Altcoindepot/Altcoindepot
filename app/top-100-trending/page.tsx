import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Top 100 Trending",
  description: "Live Dex movers by chain on AltCoin Depot — redirects to Gainers & Losers.",
  robots: { index: false, follow: true },
};

/** CoinGecko /coins/markets board removed — Dex gainers/losers is the source of truth. */
export default function Top100TrendingPage() {
  permanentRedirect("/gainers-losers");
}
