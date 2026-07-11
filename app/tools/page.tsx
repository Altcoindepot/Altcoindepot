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
          Calculators, converters, and portfolio helpers — coming soon.
        </p>
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
