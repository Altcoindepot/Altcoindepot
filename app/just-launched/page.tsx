import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { JustLaunchedSection } from "@/components/just-launched-section";
import { JustLaunchedDisclaimerModal } from "@/components/just-launched-disclaimer-modal";
import { getJustLaunchedPairs, peekJustLaunchedFetchedAt, type JustLaunchedRow } from "@/lib/dexscreener-just-launched";

const TITLE = "Just Launched Crypto Tokens – New DEX Pairs | AltCoin Depot";
const DESCRIPTION =
  "See just launched crypto tokens and new DEX pairs. Track liquidity, volume, age, and contract addresses from live DexScreener data. Extremely high risk — informational only, not financial advice.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/just-launched" },
  robots: { index: true, follow: true },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://altcoindepot.com/just-launched",
    siteName: "AltCoin Depot",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export const dynamic = "force-dynamic";

export default async function JustLaunchedPage() {
  let rows: JustLaunchedRow[] = [];
  let failed = false;
  try {
    rows = await getJustLaunchedPairs();
  } catch (err) {
    console.warn("[just-launched] page fetch failed", err);
    rows = [];
    failed = true;
  }

  const fetchedAt = peekJustLaunchedFetchedAt();

  return (
    <>
      <SiteHeader fetchedAt={fetchedAt} />
      <main id="main-content" className="border-b border-white/10 bg-[#0a0a0a] px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-[90rem]">
          <p className="text-xs uppercase tracking-widest text-zinc-500">
            <Link href="/" className="hover:text-teal-200">
              Home
            </Link>
            <span className="mx-2 text-zinc-700">/</span>
            Just Launched
          </p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">
            Just launched pairs
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
            DEX pairs created in about the last 60 minutes, newest first. Liquidity filter applied.
            High risk — pumps and dumps are common. Informational only, not financial advice.
          </p>
          {failed && rows.length === 0 ? (
            <p className="mt-6 rounded-xl border border-white/10 bg-[#0c0e14] px-4 py-8 text-sm text-zinc-500">
              Couldn&apos;t load just-launched pairs right now. Try again in a few minutes.
            </p>
          ) : (
            <Suspense fallback={<div className="mt-6 h-48 rounded-2xl border border-white/10 bg-[#0c0e14]" />}>
              <JustLaunchedSection rows={rows} />
            </Suspense>
          )}
        </div>
      </main>
      <JustLaunchedDisclaimerModal />
    </>
  );
}
