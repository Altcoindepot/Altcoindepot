import Link from "next/link";
import { CoingeckoLogoAttribution } from "@/components/coingecko-logo-attribution";

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const PRIMARY_LINKS = [
  { href: "/compare", label: "Compare coins" },
  { href: "/gainers-losers", label: "Gainers & Losers" },
  { href: "/market-overview", label: "Market overview" },
  { href: "/podcasts", label: "Podcasts" },
  { href: "/ecosystem", label: "Ecosystem" },
  { href: "/contact", label: "Contact" },
  { href: "/affiliate-disclosure", label: "Affiliate disclosure" },
] as const;

const LEGAL_LINKS = [
  { href: "/about", label: "About" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
] as const;

const LEGAL_DISCLAIMER =
  "DISCLAIMER & TERMS OF SERVICE: AltCoin Depot is an informational and educational platform tracking public market data. We do not provide individualized financial, investment, or trading advice. Cryptocurrencies are highly volatile and speculative assets carrying a severe risk of total capital loss. By using this site, you explicitly agree that all trading decisions you make are 100% your own responsibility. AltCoin Depot, its creators, and its data models are not liable for any financial losses, trading deficits, or damages resulting from the use of our automated metrics or data structures. Past performance of any narrative tracking model does not guarantee future market results. Always conduct your own thorough research.";

/**
 * Global site footer — dark slate, protective legal copy, muted chrome.
 * Mounted once from `app/layout.tsx` so it appears on every page.
 */
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-[#080a0e] px-4 py-10 sm:px-6 sm:py-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 sm:gap-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-md text-center sm:text-left">
            <p className="text-brand-altcoindepot text-lg font-extrabold tracking-tight">
              AltCoinDepot
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Live crypto prices, Market Regime, narrative rotations, and side-by-side Compare.
              Informational only — always do your own research.
            </p>
            <nav aria-label="Footer" className="mt-5">
              <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 sm:justify-start">
                {PRIMARY_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-flex min-h-9 items-center text-sm font-medium text-slate-400 opacity-90 transition-opacity duration-200 hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1a173]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="flex flex-col items-center gap-2 sm:items-end">
            <span className="text-[10px] font-medium uppercase tracking-widest text-slate-600">
              Follow
            </span>
            <a
              href="https://x.com/altcoindepot"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="AltCoinDepot on X (opens in a new tab)"
              className="group flex min-h-12 items-center gap-3 rounded-xl border border-white/10 bg-[#0c0e14] px-5 py-3 text-metallic opacity-90 transition-[opacity,border-color,box-shadow,transform] duration-200 hover:border-[#d1a173]/35 hover:opacity-100 hover:shadow-[0_0_24px_rgba(185,129,82,0.15)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1a173] active:scale-[0.98]"
            >
              <XIcon className="size-9 shrink-0 text-zinc-100 sm:size-10" />
              <span className="text-brand-altcoindepot text-sm font-bold tracking-tight">
                AltCoinDepot on X
              </span>
            </a>
          </div>
        </div>

        <section
          aria-labelledby="footer-legal-disclaimer-heading"
          className="rounded-lg border border-white/[0.06] bg-[#0a0c11]/80 px-4 py-4 sm:px-5 sm:py-5"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <h2
              id="footer-legal-disclaimer-heading"
              className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500"
            >
              Legal Disclaimer
            </h2>
            <nav aria-label="Legal" className="flex flex-wrap gap-x-4 gap-y-1 sm:justify-end">
              {LEGAL_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-xs font-medium text-slate-500 opacity-80 transition-opacity duration-200 hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1a173]"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-slate-500 sm:text-xs sm:leading-relaxed">
            {LEGAL_DISCLAIMER}
          </p>
        </section>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-6 sm:flex-row">
          <CoingeckoLogoAttribution className="text-center sm:justify-start sm:text-left" />
          <p className="text-center text-[11px] text-slate-600 sm:text-right">
            © {new Date().getFullYear()} AltCoin Depot
          </p>
        </div>
      </div>
    </footer>
  );
}
