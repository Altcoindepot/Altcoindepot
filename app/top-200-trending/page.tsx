import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Top 200 Trending",
  description: "Redirects to the Tokens Dex pairs board on AltCoin Depot.",
  robots: { index: false, follow: true },
};

/** Legacy URL — Tokens board now lives at /top-100-trending. */
export default function Top200TrendingPage() {
  permanentRedirect("/top-100-trending");
}
