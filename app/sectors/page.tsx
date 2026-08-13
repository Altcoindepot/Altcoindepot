import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { PUBLIC_CATEGORIES } from "@/lib/coin-categories";
import { DisclaimerNote } from "@/components/disclaimer-note";
import { ds } from "@/lib/ui-classes";

const TITLE = "Crypto Sectors · CoinGecko Categories | AltCoin Depot";
const DESCRIPTION =
  "Browse crypto sectors by CoinGecko category — Layer 1, DeFi, AI, Gaming, RWA, DePIN, and more. Open any sector for its top coins.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/sectors" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://altcoindepot.com/sectors",
    siteName: "AltCoin Depot",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function SectorsPage() {
  return (
    <>
      <SiteHeader />
      <main className="px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <nav className="text-xs text-zinc-500">
            <Link href="/" className="hover:text-zinc-300">
              Home
            </Link>
            <span className="mx-1.5 text-zinc-600">/</span>
            <span className="text-zinc-400">Sectors</span>
          </nav>

          <h1 className="mt-3 text-2xl font-bold text-white sm:text-3xl">Sectors</h1>
          <p className={`mt-2 max-w-2xl ${ds.subtitle}`}>
            Pick a CoinGecko category to open its coin list — price, 24h change, and market cap for
            the top names in that sector.
          </p>
          <DisclaimerNote className="mt-2">
            Categories follow CoinGecko groupings · informational only · not financial advice
          </DisclaimerNote>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PUBLIC_CATEGORIES.map((cat) => (
              <li key={cat.slug}>
                <Link
                  href={`/category/${encodeURIComponent(cat.slug)}`}
                  className={`block rounded-xl border border-white/10 bg-[#111111]/80 p-4 transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 ${cat.accentClass}`}
                >
                  <span className="text-base font-semibold text-zinc-50">{cat.title}</span>
                  <span className="mt-1.5 block text-sm leading-snug text-zinc-400">
                    {cat.description}
                  </span>
                  <span className="mt-3 inline-flex text-xs font-medium text-teal-300/90">
                    View coins →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </>
  );
}
