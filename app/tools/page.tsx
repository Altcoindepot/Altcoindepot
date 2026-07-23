import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Tools",
  description: "Altcoin calculators and utilities on Altcoin Depot.",
};

export default function ToolsPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-bold text-white">Tools</h1>
        <p className="mt-2 text-zinc-400">
          Track coins and holdings locally — no account required.
        </p>
        <ul className="mt-8 space-y-3 text-sm">
          <li>
            <Link href="/watchlist" className="text-[#d7ad82] underline-offset-2 hover:underline">
              Watchlist
            </Link>
            <span className="text-zinc-500"> — save coins to track</span>
          </li>
          <li>
            <Link href="/portfolio" className="text-[#d7ad82] underline-offset-2 hover:underline">
              Portfolio
            </Link>
            <span className="text-zinc-500"> — manual holdings &amp; total value</span>
          </li>
          <li>
            <Link href="/alerts" className="text-[#d7ad82] underline-offset-2 hover:underline">
              Price alerts
            </Link>
            <span className="text-zinc-500"> — browser notifications at a target price</span>
          </li>
        </ul>
        <Link
          href="/"
          className="mt-8 inline-block text-[#00ff9f] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a855f7]"
        >
          ← Back home
        </Link>
      </main>
    </>
  );
}
