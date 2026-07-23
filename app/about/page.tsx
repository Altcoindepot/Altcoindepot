import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about AltCoin Depot — live crypto prices, charts, and market tools.",
};

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">About AltCoin Depot</h1>
        <div className="mt-5 space-y-4 text-sm leading-relaxed text-zinc-400 sm:text-base">
          <p>
            AltCoin Depot is a focused hub for discovering altcoins, tracking live market data, and
            using simple tools like a watchlist, portfolio tracker, and price alerts — with speed and
            transparency first.
          </p>
          <p>
            Prices and market stats come primarily from CoinGecko. Charts, rankings, and trending
            boards refresh as often as upstream APIs allow.
          </p>
          <p>
            Nothing on this site is financial advice. Crypto is volatile — always do your own
            research before making decisions.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/disclaimer"
            className="inline-flex min-h-11 items-center text-sm text-[#d7ad82] underline-offset-2 hover:underline"
          >
            Disclaimer
          </Link>
          <Link
            href="/contact"
            className="inline-flex min-h-11 items-center text-sm text-[#d7ad82] underline-offset-2 hover:underline"
          >
            Contact
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center text-sm text-zinc-400 underline-offset-2 hover:underline"
          >
            ← Home
          </Link>
        </div>
      </main>
    </>
  );
}
