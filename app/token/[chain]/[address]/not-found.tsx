import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Token not found",
  description: "This DEX token page could not be loaded on AltCoin Depot.",
  robots: { index: false, follow: true },
};

export default function DexTokenNotFound() {
  return (
    <>
      <SiteHeader />
      <main className="page-shell min-h-[50vh] border-t border-white/5 px-4 py-20 text-center sm:px-6">
        <h1 className="text-brand-altcoindepot text-xl font-semibold sm:text-2xl">
          Token not found
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-zinc-400">
          We couldn&apos;t load live DexScreener data for this token contract (or pair address).
          Check the chain and address, or try again in a moment.
        </p>
        <Link
          href="/new-low-caps"
          className="mt-8 inline-flex min-h-12 items-center justify-center rounded-lg border border-teal-400/45 bg-teal-500/15 px-6 text-sm font-semibold text-teal-300 transition-[box-shadow,transform] hover:shadow-[0_0_24px_rgba(16,255,196,0.18)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400/70 active:scale-[0.98]"
        >
          Back to New &amp; Low Caps
        </Link>
      </main>
    </>
  );
}
