import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "AltCoin Depot privacy policy — no account passwords or payment cards collected; watchlists stored locally in your browser.",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-[50vh] border-t border-white/5 bg-[#0a0a0a] px-4 py-12 sm:px-6 sm:py-16">
        <article className="mx-auto max-w-3xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Legal
          </p>
          <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Privacy Policy</h1>
          <p className="mt-3 text-sm text-zinc-500">
            Last updated: August 13, 2026 · AltCoin Depot (&quot;we,&quot; &quot;us,&quot; or
            &quot;our&quot;)
          </p>

          <div className="mt-8 space-y-6 rounded-xl border border-white/[0.06] bg-[#0c0e14]/80 px-5 py-6 sm:px-7 sm:py-8">
            <section className="space-y-3">
              <h2 className="text-base font-semibold text-zinc-100">Overview</h2>
              <p className="text-sm leading-relaxed text-zinc-400 sm:text-base">
                AltCoin Depot is an informational digital media publisher focused on public
                cryptocurrency market data. We operate the site without requiring user registration,
                login credentials, or a paid subscription to browse core content.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-zinc-100">
                Information we do not collect
              </h2>
              <p className="text-sm leading-relaxed text-zinc-400 sm:text-base">
                We do not collect, process, or store user account passwords. We do not collect or
                store credit card numbers, debit card numbers, or other payment instrument details on
                our servers. AltCoin Depot does not operate a checkout flow or hosted billing profile
                for general site access.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-zinc-100">
                Watchlists and browser-local storage
              </h2>
              <p className="text-sm leading-relaxed text-zinc-400 sm:text-base">
                Custom watchlists, saved preferences, and similar personalization features are stored
                strictly in your browser&apos;s localStorage (and, where applicable, sessionStorage) on
                your device. That data remains under your control and is not uploaded to our servers as
                a cloud account profile. Clearing site data in your browser will remove locally stored
                watchlists and settings.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-zinc-100">Third-party data providers</h2>
              <p className="text-sm leading-relaxed text-zinc-400 sm:text-base">
                When you use AltCoin Depot, your browser requests market data through our application
                from third-party providers (such as CoinGecko). Those providers may receive standard
                technical request metadata (for example, IP address, user agent, and timestamps) in
                accordance with their own privacy policies.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-zinc-100">Analytics and performance</h2>
              <p className="text-sm leading-relaxed text-zinc-400 sm:text-base">
                We may use privacy-oriented analytics or performance monitoring tools to understand
                site reliability and page load behavior. We do not sell personal information to data
                brokers or advertising networks.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-zinc-100">Contact</h2>
              <p className="text-sm leading-relaxed text-zinc-400 sm:text-base">
                Questions about this Privacy Policy may be directed through our{" "}
                <Link href="/contact" className="text-[#d7ad82] underline-offset-2 hover:underline">
                  contact page
                </Link>
                .
              </p>
            </section>
          </div>

          <Link
            href="/"
            className="mt-8 inline-flex min-h-11 items-center text-sm font-medium text-[#d7ad82] underline-offset-2 hover:underline"
          >
            ← Return Home
          </Link>
        </article>
      </main>
    </>
  );
}
