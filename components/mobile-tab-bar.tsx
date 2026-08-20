"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Home", match: (p: string) => p === "/" },
  { href: "/just-launched", label: "Launched", match: (p: string) => p.startsWith("/just-launched") },
  { href: "/new-low-caps", label: "Low Caps", match: (p: string) => p.startsWith("/new-low-caps") },
  { href: "/coin", label: "Search", match: (p: string) => p.startsWith("/coin") },
] as const;

export function MobileTabBar() {
  const pathname = usePathname() || "/";

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#0a0a0a] pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="grid grid-cols-4">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={`flex min-h-11 flex-col items-center justify-center px-1 py-2 text-[11px] font-semibold ${
                  active ? "text-teal-300" : "text-zinc-500"
                }`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
