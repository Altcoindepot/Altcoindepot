import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Podcast not found",
  description: "This podcast page could not be found on AltCoin Depot.",
  robots: { index: false, follow: true },
};

export default function PodcastNotFound() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-[50vh] border-t border-white/5 bg-[#0a0a0a] px-4 py-20 text-center sm:px-6">
        <h1 className="text-brand-altcoindepot text-xl font-semibold sm:text-2xl">
          Podcast not found
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-zinc-400">
          That show isn&apos;t in our curated list. Browse all crypto podcasts from the hub.
        </p>
        <Link
          href="/podcasts"
          className="mt-8 inline-flex min-h-12 items-center justify-center rounded-lg border border-teal-400/35 bg-teal-500/10 px-6 text-sm font-semibold text-teal-200"
        >
          Crypto Podcasts
        </Link>
      </main>
    </>
  );
}
