import Link from "next/link";
import { CoingeckoLogoAttribution } from "@/components/coingecko-logo-attribution";

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden
      fill="currentColor"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const FOOTER_LINKS = [
  { href: "/about", label: "About" },
  { href: "/disclaimer", label: "Disclaimer" },
  { href: "/privacy", label: "Privacy" },
  { href: "/contact", label: "Contact" },
  { href: "/affiliate-disclosure", label: "Affiliate disclosure" },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[#f4ddc3]/15 bg-[#0b0d11]/75 px-4 py-10 backdrop-blur-md sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-md text-center sm:text-left">
            <p className="text-brand-altcoindepot text-lg font-extrabold tracking-tight">
              AltCoinDepot
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">
              Live crypto prices, charts, and tools. Not financial advice — always do your own
              research.
            </p>
            <nav aria-label="Footer" className="mt-5">
              <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 sm:justify-start">
                {FOOTER_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-flex min-h-10 items-center text-sm font-medium text-zinc-300 underline-offset-2 hover:text-[#d7ad82] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1a173]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="flex flex-col items-center gap-2 sm:items-end">
            <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-600">
              Follow
            </span>
            <a
              href="https://x.com/altcoindepot"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="AltCoinDepot on X (opens in a new tab)"
              className="group flex min-h-12 items-center gap-3 rounded-xl border border-[#f4ddc3]/22 bg-[linear-gradient(145deg,rgba(250,240,225,0.08),rgba(120,91,66,0.08))] px-5 py-3 text-metallic transition-[border-color,box-shadow,transform] hover:border-[#d1a173]/45 hover:shadow-[0_0_28px_rgba(185,129,82,0.2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1a173] active:scale-[0.98]"
            >
              <XIcon className="size-9 shrink-0 text-zinc-100 transition-colors group-hover:text-white sm:size-10" />
              <span className="text-brand-altcoindepot text-sm font-bold tracking-tight">
                AltCoinDepot on X
              </span>
            </a>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-6 sm:flex-row">
          <CoingeckoLogoAttribution className="text-center sm:justify-start sm:text-left" />
          <p className="text-center text-[11px] text-zinc-600 sm:text-right">
            © {new Date().getFullYear()} AltCoin Depot
          </p>
        </div>
      </div>
    </footer>
  );
}
