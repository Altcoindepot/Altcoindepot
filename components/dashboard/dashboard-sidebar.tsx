"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { PUBLIC_CATEGORIES } from "@/lib/coin-categories";
import { ThemeSelector } from "@/components/theme-selector";
import { ds } from "@/lib/ui-classes";

const PRIMARY_NAV = [
  {
    href: "/",
    label: "Dashboard",
    id: "dashboard",
    match: (p: string, watchlistOn: boolean) => p === "/" && !watchlistOn,
  },
  {
    href: "/sectors",
    label: "Sectors",
    id: "sectors",
    match: (p: string) => p.startsWith("/sectors") || p.startsWith("/category"),
  },
  {
    href: "/?watchlist=1",
    label: "Watchlist",
    id: "watchlist",
    match: (p: string, watchlistOn: boolean) =>
      watchlistOn || p.startsWith("/watchlist"),
  },
  {
    href: "/alerts",
    label: "Alerts",
    id: "alerts",
    match: (p: string) => p.startsWith("/alerts"),
  },
] as const;

const MORE_NAV = [
  { href: "/portfolio", label: "Portfolio", id: "portfolio" },
  { href: "/cex-trending", label: "CEX Trending", id: "cex" },
  { href: "/top-100-trending", label: "Top 100 Trending", id: "top100" },
  { href: "/podcasts", label: "Podcasts", id: "podcasts" },
] as const;

function linkClass(active: boolean) {
  return `relative rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
    active
      ? "bg-[rgba(45,212,191,0.12)] text-teal-200 shadow-[inset_3px_0_0_0_#2dd4bf]"
      : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
  }`;
}

function isWatchlistFilterOn(searchParams: URLSearchParams | null): boolean {
  if (!searchParams) return false;
  const v = searchParams.get("watchlist");
  return v === "1" || v === "true";
}

function NavLinks({
  pathname,
  watchlistOn,
  onNavigate,
  compact = false,
}: {
  pathname: string;
  watchlistOn: boolean;
  onNavigate?: () => void;
  compact?: boolean;
}) {
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  return (
    <>
      {PRIMARY_NAV.map((item) => {
        const active = item.match(pathname, watchlistOn);
        return (
          <Link
            key={item.id}
            href={item.href}
            onClick={onNavigate}
            className={compact ? linkClass(active).replace("py-2.5", "py-2") : linkClass(active)}
          >
            {item.label}
          </Link>
        );
      })}

      <div className="my-2 border-t border-white/10" />

      {MORE_NAV.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.id}
            href={item.href}
            onClick={onNavigate}
            className={compact ? linkClass(active).replace("py-2.5", "py-2") : linkClass(active)}
          >
            {item.label}
          </Link>
        );
      })}

      <div className="mt-1 border-t border-white/10 pt-2">
        <button
          type="button"
          aria-expanded={categoriesOpen}
          onClick={() => setCategoriesOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-widest text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300"
        >
          <span>Categories</span>
          <svg
            className={`size-3.5 transition-transform ${categoriesOpen ? "rotate-90" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {categoriesOpen ? (
          <div className="mt-1 flex max-h-48 flex-col gap-0.5 overflow-y-auto overscroll-contain [scrollbar-width:thin]">
            {PUBLIC_CATEGORIES.map((category) => (
              <Link
                key={category.slug}
                href={`/category/${encodeURIComponent(category.slug)}`}
                onClick={onNavigate}
                className={`rounded-lg px-3 py-2 text-sm ${
                  pathname === `/category/${category.slug}`
                    ? "bg-white/5 text-teal-200"
                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                }`}
              >
                {category.title}
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-2 border-t border-white/10 pt-2">
        <ThemeSelector />
      </div>
    </>
  );
}

export function DashboardSidebar({
  updatedLabel,
}: {
  updatedLabel?: string;
}) {
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();
  const watchlistOn = pathname === "/" && isWatchlistFilterOn(searchParams);

  return (
    <>
      {/* Desktop / large: fixed left rail */}
      <aside
        aria-label="Site navigation"
        data-sidebar-nav
        className="fixed bottom-0 left-0 top-[4.25rem] z-30 hidden w-52 flex-col border-r border-[#f4ddc3]/10 bg-[#0b0d11]/95 py-4 backdrop-blur-xl sm:top-[4.75rem] lg:flex xl:w-56"
      >
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2">
          <NavLinks pathname={pathname} watchlistOn={watchlistOn} />
        </nav>
        <p className={`${ds.disclaimer} px-4`}>
          {updatedLabel ? `Data updated ${updatedLabel}` : "Data refreshes hourly"}
        </p>
      </aside>

      {/* Mobile / tablet: horizontal strip (replaces header menu button) */}
      <nav
        aria-label="Site navigation"
        className="sticky top-[4.25rem] z-40 border-b border-[#f4ddc3]/10 bg-[#0b0d11]/95 backdrop-blur-xl sm:top-[4.75rem] lg:hidden"
      >
        <div className="flex gap-1 overflow-x-auto px-2 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[...PRIMARY_NAV, ...MORE_NAV].map((item) => {
            const active =
              "match" in item && typeof item.match === "function"
                ? item.match(pathname, watchlistOn)
                : pathname.startsWith(item.href.split("#")[0] || item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${
                  active
                    ? "bg-teal-500/15 text-teal-200"
                    : "bg-white/5 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/sectors"
            className="shrink-0 rounded-full bg-white/5 px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-zinc-400 hover:text-zinc-200"
          >
            Sectors
          </Link>
        </div>
      </nav>
    </>
  );
}
