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
  PAIRS_DEFAULT_QUERY,
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

function IconMovers() {
  return (
    <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M4 16.5 9 11l3.5 3.5L20 7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 7h6v6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconNews() {
  return (
    <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H16v14.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 4 18.5V5.5Z" />
      <path d="M16 6h2.5A1.5 1.5 0 0 1 20 7.5v11A1.5 1.5 0 0 1 18.5 20H16" strokeLinecap="round" />
      <path d="M7 8h6M7 11h6M7 14h4" strokeLinecap="round" />
    </svg>
  );
}

function IconPodcasts() {
  return (
    <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 3a5 5 0 0 0-5 5v3a5 5 0 0 0 10 0V8a5 5 0 0 0-5-5Z" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" strokeLinecap="round" />
    </svg>
  );
}

/** Primary nav — real routes only, icon + label. News/Podcasts are top-level (not under Resources). */
const DESKTOP_NAV: NavItem[] = [
  {
    href: "/",
    label: "Explore",
    match: (p) => p === "/",
    icon: <IconExplore />,
  },
  {
    href: "/news",
    label: "News",
    match: (p) => p.startsWith("/news"),
    icon: <IconNews />,
  },
  {
    href: "/podcasts",
    label: "Podcasts",
    match: (p) => p.startsWith("/podcasts"),
    icon: <IconPodcasts />,
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
    href: "/pairs",
    label: "Pairs",
    match: (p) => p.startsWith("/pairs"),
    icon: <IconPairs />,
  },
  {
    href: "/gainers-losers",
    label: "Gainers",
    match: (p) => p.startsWith("/gainers-losers"),
    icon: <IconMovers />,
  },
  {
    href: "/dex-scanner",
    label: "Scanner",
    match: (p) => p.startsWith("/dex-scanner"),
    icon: <IconScanner />,
  },
];

function filterDefaults(pathname: string): DexListQuery {
  if (pathname.startsWith("/just-launched")) return JUST_LAUNCHED_DEFAULT_QUERY;
  if (pathname.startsWith("/pairs")) return PAIRS_DEFAULT_QUERY;
  if (pathname.startsWith("/new-low-caps")) return LOW_CAPS_DEFAULT_QUERY;
  return DEFAULT_DEX_LIST_QUERY;
}

export function SiteHeaderClient({ fetchedAt }: { fetchedAt?: number | null }) {
  const pathname = usePathname() || "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const defaults = filterDefaults(pathname);

  return (
    <>
      <header className="site-header-shell">
        <div className="site-header-capsule">
          <BrandHomeLink className="shrink-0" showTagline={false} />

          {/* Same primary nav chrome on all breakpoints — scrollable pills on phone */}
          <nav
            aria-label="Primary"
            className="ml-0.5 flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto overflow-y-visible [scrollbar-width:none] xl:ml-3 [&::-webkit-scrollbar]:hidden"
          >
            {DESKTOP_NAV.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`site-nav-link inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full px-2 text-[11px] font-medium transition-colors sm:min-h-10 sm:gap-1.5 sm:px-2.5 sm:text-[13px] xl:px-3 ${
                    active ? "nav-pill-active" : ""
                  }`}
                >
                  <span className="site-nav-icon" aria-hidden>
                    {item.icon}
                  </span>
                  <span className="whitespace-nowrap">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex min-w-0 shrink items-center gap-1.5">
            <div className="min-w-0 w-[min(42vw,11rem)] sm:w-[12rem] lg:min-w-[14rem] lg:w-auto">
              <CoinSearchBar
                inputId="header-coin-search"
                placeholder="Ticker or contract"
                showSubmitButton={false}
              />
            </div>
            <button
              type="button"
              className="site-nav-menu-btn inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-full"
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
