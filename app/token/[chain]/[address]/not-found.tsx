import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Token not found",
  description: "This DEX token page could not be loaded on AltCoin Depot.",
};

export default function DexTokenNotFound() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-[50vh] border-t border-white/5 bg-[#0a0a0a] px-4 py-20 text-center sm:px-6">
        <h1 className="text-brand-altcoindepot text-xl font-semibold sm:text-2xl">
          Token not found
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-zinc-400">
          We couldn&apos;t load live DexScreener data for this token contract (or pair address).
          Check the chain and address, or try again in a moment.
        </p>
        <Link
          href="/new-low-caps"
          className="mt-8 inline-flex min-h-12 items-center justify-center rounded-lg border border-[#d1a173]/45 bg-[#d1a173]/15 px-6 text-sm font-semibold text-[#d7ad82] transition-[box-shadow,transform] hover:shadow-[0_0_24px_rgba(185,129,82,0.2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1a173] active:scale-[0.98]"
        >
          Back to New &amp; Low Caps
        </Link>
      </main>
    </>
  );
}
