import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { EcosystemWikiBrowser } from "@/components/ecosystem-wiki-browser";
import { DisclaimerNote } from "@/components/disclaimer-note";
import { ds } from "@/lib/ui-classes";

const TITLE = "Ecosystem & Developer Resources | AltCoin Depot";
const DESCRIPTION =
  "Official portals, explorers, docs, and community links for Bitcoin, Ethereum, Solana, Injective, and other core crypto ecosystems.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/ecosystem" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://altcoindepot.com/ecosystem",
    siteName: "AltCoin Depot",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function EcosystemPage() {
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
            <span className="text-zinc-400">Ecosystem</span>
          </nav>

          <h1 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
            Ecosystem &amp; Developer Resources
          </h1>
          <p className={`mt-2 max-w-2xl ${ds.subtitle}`}>
            Official project portals, explorers, docs, and community links for core chains — including
            Solana and Injective. Outbound links open in a new tab.
          </p>
          <DisclaimerNote className="mt-2">
            Curated wiki map · informational only · not financial advice
          </DisclaimerNote>

          <div className="mt-8">
            <EcosystemWikiBrowser />
          </div>
        </div>
      </main>
    </>
  );
}
