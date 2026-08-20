"use client";

import { useState } from "react";
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

const DESKTOP_NAV = [
  { href: "/", label: "Home", match: (p: string) => p === "/" },
  { href: "/just-launched", label: "Just Launched", match: (p: string) => p.startsWith("/just-launched") },
  { href: "/new-low-caps", label: "New & Low Caps", match: (p: string) => p.startsWith("/new-low-caps") },
  { href: "/sectors", label: "Sectors", match: (p: string) => p.startsWith("/sectors") || p.startsWith("/category") },
] as const;

function filterDefaults(pathname: string): DexListQuery {
  if (pathname.startsWith("/just-launched")) return JUST_LAUNCHED_DEFAULT_QUERY;
  if (pathname.startsWith("/new-low-caps") || pathname === "/") return LOW_CAPS_DEFAULT_QUERY;
  return DEFAULT_DEX_LIST_QUERY;
}

export function SiteHeader({ fetchedAt }: { fetchedAt?: number | null }) {
  const pathname = usePathname() || "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const defaults = filterDefaults(pathname);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0a]/90 backdrop-blur-xl">
        <div className="flex min-h-12 items-center gap-2 px-2 py-1.5 sm:px-4 sm:py-2">
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-zinc-300 hover:bg-white/5 lg:hidden"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>

          <BrandHomeLink className="shrink-0" />

          <nav aria-label="Primary" className="ml-4 hidden items-center gap-1 lg:flex">
            {DESKTOP_NAV.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium ${
                    active ? "bg-teal-500/15 text-teal-200" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <div className="hidden sm:flex">
              <CoinSearchBar inputId="header-coin-search" />
            </div>
            <button
              type="button"
              className="hidden min-h-11 min-w-11 items-center justify-center rounded-lg text-zinc-300 hover:bg-white/5 lg:inline-flex"
              aria-label="More"
              onClick={() => setMenuOpen(true)}
            >
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </header>
      <SiteMoreDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
      <DexFilterSummary fetchedAt={fetchedAt} defaults={defaults} />
    </>
  );
}
