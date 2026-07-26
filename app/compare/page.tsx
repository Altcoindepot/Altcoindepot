import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { CompareClient } from "@/components/compare-client";

export const metadata: Metadata = {
  title: "Compare Cryptocurrencies",
  description:
    "Compare 2–3 cryptocurrencies side by side — live price, 24h and 7d change, market cap, and volume on AltCoin Depot.",
  robots: { index: true, follow: true },
};

export default function ComparePage() {
  return (
    <>
      <SiteHeader />
      <CompareClient />
    </>
  );
}
