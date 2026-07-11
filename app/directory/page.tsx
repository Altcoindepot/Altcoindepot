import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Directory",
  description: "Browse altcoins and projects on Altcoin Depot.",
};

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-bold text-white">Directory</h1>
        <p className="mt-2 text-zinc-400">
          Search and curated listings will live here. This page is a placeholder for navigation.
        </p>
        {q ? (
          <p className="mt-6 text-sm text-zinc-500">
            You searched for:{" "}
            <span className="font-mono text-zinc-300">{q}</span>
          </p>
        ) : null}
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
