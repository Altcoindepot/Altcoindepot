import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Affiliate disclosure",
  description: "How AltCoin Depot may earn commissions from affiliate links.",
};

export default function AffiliateDisclosurePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Affiliate disclosure</h1>
        <div className="mt-5 space-y-4 text-sm leading-relaxed text-zinc-400 sm:text-base">
          <p>
            Some links on AltCoin Depot — including exchange “where to buy” buttons and partner
            referrals — may be affiliate links. If you click and sign up or trade, we may earn a
            commission at no extra cost to you.
          </p>
          <p>
            Affiliate relationships never change the market data we show from CoinGecko or other
            sources. Rankings and prices are not paid placements unless clearly labeled as
            advertising.
          </p>
          <p>
            We only recommend or surface venues we believe are useful for discovery; always verify
            the destination site and use strong security practices.
          </p>
        </div>
        <Link
          href="/"
          className="mt-8 inline-flex min-h-11 items-center text-sm text-zinc-400 underline-offset-2 hover:underline"
        >
          ← Home
        </Link>
      </main>
    </>
  );
}
