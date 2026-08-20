"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeSelector } from "@/components/theme-selector";
import { ResourcesNavAccordion } from "@/components/resources-nav-accordion";

/** Secondary destinations — Resources stays nested; primary scanner routes live in bottom tabs. */
const SECONDARY = [
  { href: "/gainers-losers", label: "Gainers & Losers" },
  { href: "/pairs", label: "Pairs" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/alerts", label: "Alerts" },
  { href: "/sectors", label: "Sectors" },
  { href: "/just-launched", label: "Just Launched" },
  { href: "/new-low-caps", label: "New & Low Caps" },
  { href: "/top-100-trending", label: "Tokens" },
  { href: "/about", label: "About" },
  { href: "/disclaimer", label: "Disclaimer" },
  { href: "/privacy", label: "Privacy" },
] as const;

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
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-label="Menu"
        className="absolute inset-y-0 left-0 flex w-[min(20rem,88vw)] flex-col border-r border-white/10 bg-[#0a0a0a] px-3 py-4 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between gap-2 px-1">
          <Link href="/" aria-label="AltCoin Depot home" onClick={onClose}>
            <BrandLogo variant="lockup" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>
        <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
          <p className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
            Theme
          </p>
          <ThemeSelector />
          <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
            Resources
          </p>
          <ResourcesNavAccordion onNavigate={onClose} />
          <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
            More
          </p>
          {SECONDARY.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium ${
                  active ? "bg-teal-500/15 text-teal-200" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </div>
  );
}
