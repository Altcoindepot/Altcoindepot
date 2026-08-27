import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { DATA_RESPONSIBILITY_DISCLAIMER } from "@/lib/data-responsibility";

export const metadata: Metadata = {
  title: "Disclaimer",
  description:
    "Important disclaimer for market data, contract addresses, and content on AltCoin Depot.",
};

export default function DisclaimerPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-brand-altcoindepot text-2xl font-bold tracking-tight sm:text-3xl">
          Disclaimer
        </h1>
        <div className="mt-5 space-y-4 text-sm leading-relaxed text-zinc-400 sm:text-base">
          <p>
            AltCoin Depot provides market information for educational and informational purposes
            only. Nothing on this website constitutes investment, legal, tax, or trading advice.
          </p>
          <p>
            Cryptocurrency markets are highly volatile. Past performance does not guarantee future
            results. You are solely responsible for your own research and decisions.
          </p>
          <p>{DATA_RESPONSIBILITY_DISCLAIMER}</p>
          <p>
            Data is also sourced from other third parties (including CoinGecko and exchange APIs where
            used) and may be delayed, incomplete, or inaccurate. We do not guarantee uninterrupted
            availability.
          </p>
          <p>
            Some links may be affiliate links. See our{" "}
            <Link
              href="/affiliate-disclosure"
              className="text-[#d7ad82] underline-offset-2 hover:underline"
            >
              affiliate disclosure
            </Link>{" "}
            for details.
          </p>
          <p>
            See also our{" "}
            <Link href="/terms" className="text-[#d7ad82] underline-offset-2 hover:underline">
              Terms of Service
            </Link>
            .
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
