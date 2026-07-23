import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How AltCoin Depot handles privacy, local storage, and analytics.",
};

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Privacy</h1>
        <div className="mt-5 space-y-4 text-sm leading-relaxed text-zinc-400 sm:text-base">
          <p>
            AltCoin Depot is designed to work without requiring an account. Watchlist, portfolio,
            price alerts, recently viewed coins, and theme preference are stored in your browser’s
            local storage on your device — we do not host those as a logged-in cloud profile.
          </p>
          <p>
            When you use the site, your browser requests market data through our servers from
            providers such as CoinGecko. Those providers may process standard technical information
            (for example IP address and request metadata) according to their own policies.
          </p>
          <p>
            We may use privacy-friendly analytics (such as Vercel Speed Insights) to understand
            performance. We do not sell personal information.
          </p>
          <p>
            Browser notification permission for price alerts is optional and controlled by you in
            your browser settings.
          </p>
          <p>
            Questions? Reach us via the{" "}
            <Link href="/contact" className="text-[#d7ad82] underline-offset-2 hover:underline">
              contact
            </Link>{" "}
            page.
          </p>
        </div>
        <Link
          href="/"
          className="mt-8 inline-flex min-h-11 items-center text-sm text-zinc-400 underline-offset-2 hover:underline"
        >
          ← Home
        </Link>
      </main>
    </>
  );
}
