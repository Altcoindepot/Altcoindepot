import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "AltCoin Depot terms of service — informational publisher terms, no financial advice, local watchlist storage.",
};

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-[50vh] border-t border-white/5 bg-[#0a0a0a] px-4 py-12 sm:px-6 sm:py-16">
        <article className="mx-auto max-w-3xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Legal
          </p>
          <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Terms of Service</h1>
          <p className="mt-3 text-sm text-zinc-500">
            Last updated: August 13, 2026 · AltCoin Depot (&quot;we,&quot; &quot;us,&quot; or
            &quot;our&quot;)
          </p>

          <div className="mt-8 space-y-6 rounded-xl border border-white/[0.06] bg-[#0c0e14]/80 px-5 py-6 sm:px-7 sm:py-8">
            <section className="space-y-3">
              <h2 className="text-base font-semibold text-zinc-100">Acceptance of terms</h2>
              <p className="text-sm leading-relaxed text-zinc-400 sm:text-base">
                By accessing or using AltCoin Depot, you agree to these Terms of Service. If you do
                not agree, please discontinue use of the site. These terms apply to all visitors and
                users of our informational publishing platform.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-zinc-100">Informational purpose only</h2>
              <p className="text-sm leading-relaxed text-zinc-400 sm:text-base">
                AltCoin Depot publishes market data, charts, narrative context, and educational
                commentary for general informational purposes. Nothing on this site constitutes
                investment, financial, legal, or tax advice. Cryptocurrency assets are volatile and
                speculative; you are solely responsible for your own research and trading decisions.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-zinc-100">No accounts or payment data</h2>
              <p className="text-sm leading-relaxed text-zinc-400 sm:text-base">
                AltCoin Depot does not require user passwords for site access and does not collect or
                store credit card or payment card information on our servers. We do not maintain a
                traditional user account database for core browsing features.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-zinc-100">Local watchlist storage</h2>
              <p className="text-sm leading-relaxed text-zinc-400 sm:text-base">
                Custom watchlists and related personalization are saved exclusively in your browser
                localStorage. You acknowledge that locally stored data is device-specific, may be
                cleared by browser settings, and is not guaranteed to sync across devices unless you
                independently back it up.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-zinc-100">Data accuracy and availability</h2>
              <p className="text-sm leading-relaxed text-zinc-400 sm:text-base">
                Market metrics, rankings, and third-party feeds may be delayed, incomplete, or
                inaccurate. We do not warrant uninterrupted service or error-free data. See our{" "}
                <Link
                  href="/disclaimer"
                  className="text-[#d7ad82] underline-offset-2 hover:underline"
                >
                  disclaimer
                </Link>{" "}
                for additional risk disclosures.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-zinc-100">Limitation of liability</h2>
              <p className="text-sm leading-relaxed text-zinc-400 sm:text-base">
                To the fullest extent permitted by law, AltCoin Depot and its operators shall not be
                liable for any indirect, incidental, special, or consequential damages arising from
                your use of the site, including trading losses based on displayed metrics or content.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-zinc-100">Changes and contact</h2>
              <p className="text-sm leading-relaxed text-zinc-400 sm:text-base">
                We may update these Terms from time to time by posting a revised version on this
                page. Continued use after changes constitutes acceptance. For questions, contact us
                via the{" "}
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
