import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { ContactFeedbackForm } from "@/components/contact-feedback-form";
import { ds } from "@/lib/ui-classes";

export const metadata: Metadata = {
  title: "Feedback & Contact",
  description:
    "Send AltCoin Depot feedback — what to add, what’s broken, or data issues. Email AltCoinDepot@gmail.com or reach us on X.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main
        id="main-content"
        className="page-shell border-b border-white/10 px-3 py-8 sm:px-6 sm:py-12"
      >
        <div className="mx-auto max-w-3xl">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">
            <Link href="/" className="hover:text-teal-200">
              Home
            </Link>
            <span className="mx-2 text-zinc-700">/</span>
            Feedback
          </p>
          <h1 className="text-brand-altcoindepot mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Feedback
          </h1>
          <p className={`${ds.subtitle} mt-2 max-w-xl`}>
            Tell us what to add or what’s broken. Opens your email app to{" "}
            <span className="text-zinc-300">AltCoinDepot@gmail.com</span> — no accounts, no public
            comment wall.
          </p>

          <div className="mt-6 sm:mt-8">
            <Suspense
              fallback={
                <div className="glass-panel h-64 animate-pulse rounded-2xl" aria-hidden />
              }
            >
              <ContactFeedbackForm />
            </Suspense>
          </div>

          <div className="mt-8 glass-panel rounded-2xl px-4 py-5 sm:px-5">
            <p className={ds.label}>Other ways to reach us</p>
            <ul className="mt-3 space-y-2">
              <li>
                <a
                  href="https://x.com/altcoindepot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center text-sm font-medium text-teal-300 underline-offset-2 hover:underline"
                >
                  @altcoindepot on X
                </a>
              </li>
              <li>
                <a
                  href="mailto:AltCoinDepot@gmail.com"
                  className="inline-flex min-h-11 items-center text-sm font-medium text-teal-300 underline-offset-2 hover:underline"
                >
                  AltCoinDepot@gmail.com
                </a>
              </li>
            </ul>
          </div>

          <Link
            href="/"
            className="mt-8 inline-flex min-h-11 items-center text-sm text-zinc-400 underline-offset-2 hover:underline"
          >
            ← Home
          </Link>
        </div>
      </main>
    </>
  );
}
