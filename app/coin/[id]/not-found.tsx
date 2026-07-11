import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function CoinNotFound() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-[50vh] border-t border-white/5 bg-[#0a0a0a] px-4 py-20 text-center sm:px-6">
        <h1 className="text-metallic-hero text-2xl font-bold">Coin not found</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-zinc-400">
          That CoinGecko id doesn&apos;t exist or was removed. Try another coin from the featured
          list on the home page.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-lg border border-[#00ff9f]/40 bg-[#00ff9f]/10 px-5 py-2.5 text-sm font-semibold text-[#00ff9f] transition-[box-shadow] hover:shadow-[0_0_20px_rgba(0,255,159,0.2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a855f7]"
        >
          Back to Altcoin Depot
        </Link>
      </main>
    </>
  );
}
