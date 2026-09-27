"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeSelector } from "@/components/theme-selector";
import { ResourcesNavAccordion } from "@/components/resources-nav-accordion";

/** Top-level destinations — News/Podcasts first so they are one tap, not under Resources. */
const PRIMARY = [
  { href: "/news", label: "News" },
  { href: "/podcasts", label: "Podcasts" },
  { href: "/dex-scanner", label: "Scanner" },
  { href: "/new-low-caps", label: "New & Low Caps" },
  { href: "/gainers-losers", label: "Gainers & Losers" },
  { href: "/pairs", label: "Pairs" },
  { href: "/just-launched", label: "Just Launched" },
  { href: "/top-100-trending", label: "Tokens" },
] as const;

const SECONDARY = [
  { href: "/sectors", label: "Sectors" },
  { href: "/contact", label: "Feedback" },
  { href: "/about", label: "About" },
  { href: "/disclaimer", label: "Disclaimer" },
  { href: "/privacy", label: "Privacy" },
] as const;

/** Shown as non-navigating “Soon” so they don’t bounce to empty tools. */
const COMING_SOON = ["Watchlist", "Portfolio", "Alerts"] as const;

function drawerLinkClass(active: boolean) {
  return `site-drawer-link inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium ${
    active ? "site-drawer-link-active" : ""
  }`;
}

export function SiteMoreDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname() || "/";
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        aria-label="Close menu"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-label="Menu"
        className="site-more-drawer absolute inset-y-0 left-0 flex w-[min(20rem,88vw)] flex-col rounded-none border-y-0 border-l-0 px-3 py-4 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between gap-2 px-1">
          <Link href="/" aria-label="AltCoin Depot home" onClick={onClose}>
            <BrandLogo variant="lockup" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="site-nav-menu-btn inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>
        <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
          <p className="site-drawer-section px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-widest">
            Theme
          </p>
          <ThemeSelector />
          <p className="site-drawer-section px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-widest">
            Browse
          </p>
          {PRIMARY.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={drawerLinkClass(active)}
              >
                {item.label}
              </Link>
            );
          })}
          <p className="site-drawer-section px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-widest">
            Resources
          </p>
          <ResourcesNavAccordion onNavigate={onClose} />
          <p className="site-drawer-section px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-widest">
            More
          </p>
          {SECONDARY.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={drawerLinkClass(active)}
              >
                {item.label}
              </Link>
            );
          })}
          <p className="site-drawer-section px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-widest">
            Coming soon
          </p>
          {COMING_SOON.map((label) => (
            <span
              key={label}
              className="site-drawer-soon inline-flex min-h-11 items-center justify-between gap-2 rounded-lg px-3 text-sm"
              aria-disabled="true"
            >
              <span>{label}</span>
              <span className="site-drawer-soon-badge rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider">
                Soon
              </span>
            </span>
          ))}
        </nav>
      </aside>
    </div>
  );
}
