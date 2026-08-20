"use client";

import type { ReactNode } from "react";
import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CoinSearchBar } from "@/components/coin-search-bar";
import { BrandHomeLink } from "@/components/brand-logo";
import { SiteMoreDrawer } from "@/components/site-more-drawer";
import { DexFilterSummary } from "@/components/dex-filter-summary";
import {
  DEFAULT_DEX_LIST_QUERY,
  JUST_LAUNCHED_DEFAULT_QUERY,
  LOW_CAPS_DEFAULT_QUERY,
  type DexListQuery,
} from "@/lib/dex-list-query";

type NavItem = {
  href: string;
  label: string;
  match: (pathname: string) => boolean;
  icon: ReactNode;
};

function IconExplore() {
  return (
    <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 15.5 2.2-6.3 6.3-2.2-2.2 6.3-6.3 2.2z" strokeLinejoin="round" />
    </svg>
  );
}

function IconTokens() {
  return (
    <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="9" cy="12" r="5.5" />
      <path d="M14.5 7.2a5.5 5.5 0 0 1 0 9.6" strokeLinecap="round" />
    </svg>
  );
}

function IconPairs() {
  return (
    <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M8 7h11M8 12h11M8 17h11" strokeLinecap="round" />
      <circle cx="5" cy="7" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="5" cy="12" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="5" cy="17" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconScanner() {
  return (
    <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16" strokeLinecap="round" />
      <path d="M7 12h10" strokeLinecap="round" />
    </svg>
  );
}

function IconWatchlist() {
  return (
    <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path
        d="m12 4.5 2.1 4.3 4.7.7-3.4 3.3.8 4.7L12 15.2 7.8 17.5l.8-4.7-3.4-3.3 4.7-.7L12 4.5z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPortfolio() {
  return (
    <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="3.5" y="7" width="17" height="12.5" rx="2" />
      <path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7" strokeLinecap="round" />
      <path d="M3.5 12h17" strokeLinecap="round" />
    </svg>
  );
}

function IconMovers() {
  return (
    <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M4 16.5 9 11l3.5 3.5L20 7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 7h6v6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Desktop primary nav — real routes only, icon + label. */
const DESKTOP_NAV: NavItem[] = [
  {
    href: "/",
    label: "Explore",
    match: (p) => p === "/",
    icon: <IconExplore />,
  },
  {
    href: "/top-100-trending",
    label: "Tokens",
    match: (p) =>
      p.startsWith("/top-100-trending") ||
      p.startsWith("/top-200-trending") ||
      p.startsWith("/cex-trending"),
    icon: <IconTokens />,
  },
  {
    href: "/new-low-caps",
    label: "Pairs",
    match: (p) => p.startsWith("/new-low-caps"),
    icon: <IconPairs />,
  },
  {
    href: "/gainers-losers",
    label: "Gainers",
    match: (p) => p.startsWith("/gainers-losers"),
    icon: <IconMovers />,
  },
  {
    href: "/just-launched",
    label: "DEX Scanner",
    match: (p) => p.startsWith("/just-launched") || p.startsWith("/token/"),
    icon: <IconScanner />,
  },
  {
    href: "/watchlist",
    label: "Watchlist",
    match: (p) => p.startsWith("/watchlist"),
    icon: <IconWatchlist />,
  },
  {
    href: "/portfolio",
    label: "Portfolio",
    match: (p) => p.startsWith("/portfolio"),
    icon: <IconPortfolio />,
  },
];

function filterDefaults(pathname: string): DexListQuery {
  if (pathname.startsWith("/just-launched")) return JUST_LAUNCHED_DEFAULT_QUERY;
  if (pathname.startsWith("/new-low-caps") || pathname === "/") return LOW_CAPS_DEFAULT_QUERY;
  return DEFAULT_DEX_LIST_QUERY;
}

export function SiteHeaderClient({ fetchedAt }: { fetchedAt?: number | null }) {
  const pathname = usePathname() || "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const defaults = filterDefaults(pathname);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0a]/92 backdrop-blur-xl">
        <div className="mx-auto flex min-h-14 max-w-[90rem] items-center gap-2 overflow-visible px-2 py-1.5 sm:gap-3 sm:px-4 sm:py-2">
          {/* Mobile: hamburger + brand only */}
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-zinc-300 hover:bg-white/5 lg:hidden"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>

          <BrandHomeLink className="shrink-0" showTagline />

          {/* Desktop icon + label nav */}
          <nav
            aria-label="Primary"
            className="ml-1 hidden min-w-0 flex-1 items-center gap-0.5 overflow-x-auto overflow-y-visible [scrollbar-width:none] lg:flex xl:ml-3 [&::-webkit-scrollbar]:hidden"
          >
            {DESKTOP_NAV.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-medium transition-colors xl:px-3 ${
                    active
                      ? "bg-teal-500/15 text-teal-200"
                      : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                  }`}
                >
                  <span className={active ? "text-teal-300" : "text-zinc-500"}>{item.icon}</span>
                  <span className="whitespace-nowrap">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            {/* Desktop search only — mobile uses bottom Search tab */}
            <div className="hidden lg:block">
              <CoinSearchBar
                inputId="header-coin-search"
                placeholder="Search tokens, pairs…"
                showSubmitButton={false}
              />
            </div>
            <button
              type="button"
              className="hidden min-h-10 min-w-10 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-zinc-200 lg:inline-flex"
              aria-label="More"
              onClick={() => setMenuOpen(true)}
            >
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M5 12h.01M12 12h.01M19 12h.01" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </header>
      <SiteMoreDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
      <Suspense fallback={null}>
        <DexFilterSummary fetchedAt={fetchedAt} defaults={defaults} />
      </Suspense>
    </>
  );
}
