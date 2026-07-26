import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { CompareClient } from "@/components/compare-client";
import { DisclaimerNote } from "@/components/disclaimer-note";
import { ds } from "@/lib/ui-classes";

const TITLE = "Compare Crypto Prices Side by Side | AltCoin Depot";
const DESCRIPTION =
  "Compare cryptocurrency prices, performance, market cap, and volume side by side. Track 2–3 coins at once on AltCoin Depot.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  robots: { index: true, follow: true },
  alternates: { canonical: "/compare" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://altcoindepot.com/compare",
    siteName: "AltCoin Depot",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

type Props = {
  searchParams: Promise<{ coins?: string; add?: string }>;
};

function parseCoinIds(raw: string | undefined): string[] {
  if (!raw) return [];
  return [
    ...new Set(
      raw
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter((s) => /^[a-z0-9-]{1,64}$/.test(s)),
    ),
  ].slice(0, 3);
}

export default async function ComparePage({ searchParams }: Props) {
  const params = await searchParams;
  const fromCoins = parseCoinIds(params.coins);
  const fromAdd = parseCoinIds(params.add);
  const initialIds = [...new Set([...fromCoins, ...fromAdd])].slice(0, 3);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <p className="text-xs uppercase tracking-widest text-zinc-500">
          <Link href="/" className="hover:text-[#d7ad82]">
            Home
          </Link>
          <span className="mx-2 text-zinc-700">/</span>
          Compare
        </p>

        <h1 className="mt-3 flex items-center gap-3 text-xl font-extrabold tracking-tight sm:text-2xl">
          <span
            className="hidden h-7 w-1 shrink-0 rounded-full bg-[#d1a173]/80 sm:block"
            aria-hidden
          />
          <span className="text-brand-altcoindepot">Compare Crypto Prices Side by Side</span>
        </h1>
        <p className={ds.subtitle}>
          Compare cryptocurrency prices, performance, market cap, and volume side by side. Track 2–3
          coins at once — free, live data on AltCoin Depot.
        </p>
        <DisclaimerNote />

        <ul className="mt-5 grid gap-2 text-sm text-zinc-400 sm:grid-cols-3">
          <li className={ds.stat}>Live price &amp; 24h / 7d change</li>
          <li className={ds.stat}>Market cap &amp; volume side by side</li>
          <li className={ds.stat}>Market cap parity price thought experiment</li>
        </ul>

        <div className="mt-8">
          <CompareClient initialIds={initialIds} />
        </div>

        <section className="mt-12 border-t border-white/10 pt-8" aria-labelledby="compare-why">
          <h2 id="compare-why" className="text-base font-semibold text-zinc-100">
            Why compare coins on AltCoin Depot?
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-400">
            Spot relative strength quickly: see which asset is outperforming on price, breadth, and
            liquidity without jumping between tabs. Market cap parity shows what each coin’s price
            would be at another coin’s market cap. Pair this with coin pages that show{" "}
            <strong className="font-medium text-zinc-300">Compared to BTC</strong> and{" "}
            <Link href="/" className="text-[#d7ad82] underline-offset-2 hover:underline">
              Market Regime
            </Link>{" "}
            on the homepage for context.
          </p>
          <nav className="mt-4 flex flex-wrap gap-3" aria-label="Related tools">
            <Link href="/" className={ds.btnSecondary}>
              Market Regime
            </Link>
            <Link href="/gainers-losers" className={ds.btnSecondary}>
              Gainers &amp; Losers
            </Link>
            <Link href="/watchlist" className={ds.btnSecondary}>
              Watchlist
            </Link>
          </nav>
        </section>
      </main>
    </>
  );
}
