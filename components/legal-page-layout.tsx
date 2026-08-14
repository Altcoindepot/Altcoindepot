import Link from "next/link";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";

type LegalPageLayoutProps = {
  title: string;
  description?: string;
  lastUpdated?: string;
  children: ReactNode;
};

/**
 * Shared shell for long-form legal / policy pages.
 * Dark background, centered max-w-3xl column, muted slate body copy.
 */
export function LegalPageLayout({
  title,
  description,
  lastUpdated = "August 13, 2026",
  children,
}: LegalPageLayoutProps) {
  return (
    <>
      <SiteHeader />
      <main className="min-h-[60vh] border-t border-white/5 bg-[#09090b] px-4 py-12 sm:px-6 sm:py-16">
        <article className="mx-auto w-full max-w-3xl">
          <header className="border-b border-white/[0.06] pb-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Legal
            </p>
            <h1 className="mt-2 text-brand-altcoindepot text-2xl font-bold tracking-tight sm:text-3xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-3 text-sm leading-relaxed text-slate-400">{description}</p>
            ) : null}
            <p className="mt-3 text-xs text-slate-500 sm:text-sm">
              Last updated: {lastUpdated} · AltCoin Depot (&quot;we,&quot; &quot;us,&quot; or
              &quot;our&quot;)
            </p>
          </header>

          <div className="mt-8 space-y-8 text-sm leading-relaxed text-slate-400 sm:text-base sm:leading-relaxed">
            {children}
          </div>

          <footer className="mt-10 border-t border-white/[0.06] pt-6">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center text-sm font-medium text-[#d7ad82] underline-offset-2 transition-opacity hover:underline hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1a173]"
            >
              ← Return Home
            </Link>
          </footer>
        </article>
      </main>
    </>
  );
}

type LegalSectionProps = {
  title: string;
  children: ReactNode;
};

/** Semantic section block for legal page body content. */
export function LegalSection({ title, children }: LegalSectionProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-slate-100 sm:text-lg">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
