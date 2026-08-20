"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function IconHome({ active }: { active: boolean }) {
  return (
    <svg
      className="size-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.25 : 1.75}
      aria-hidden
    >
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z" strokeLinejoin="round" />
    </svg>
  );
}

/** Bar chart — reserved for DEX Scanner only. */
function IconScanner({ active }: { active: boolean }) {
  return (
    <svg
      className="size-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.25 : 1.75}
      aria-hidden
    >
      <path d="M4 20V10M10 20V4M16 20v-7M22 20V8" strokeLinecap="round" />
    </svg>
  );
}

/** Coins / low-cap metaphor — not a bar chart. */
function IconLowCaps({ active }: { active: boolean }) {
  return (
    <svg
      className="size-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.25 : 1.75}
      aria-hidden
    >
      <circle cx="9" cy="12" r="5.25" />
      <path d="M14.4 7.6a5.25 5.25 0 0 1 0 8.8" strokeLinecap="round" />
    </svg>
  );
}

function IconSearch({ active }: { active: boolean }) {
  return (
    <svg
      className="size-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.25 : 1.75}
      aria-hidden
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16.2 16.2 3.8 3.8" strokeLinecap="round" />
    </svg>
  );
}

const TABS: Array<{
  href: string;
  label: string;
  match: (p: string) => boolean;
  icon: (active: boolean) => ReactNode;
}> = [
  {
    href: "/",
    label: "Home",
    match: (p) => p === "/",
    icon: (a) => <IconHome active={a} />,
  },
  {
    href: "/dex-scanner",
    label: "Scanner",
    match: (p) => p.startsWith("/dex-scanner"),
    icon: (a) => <IconScanner active={a} />,
  },
  {
    href: "/new-low-caps",
    label: "Low Caps",
    match: (p) => p.startsWith("/new-low-caps"),
    icon: (a) => <IconLowCaps active={a} />,
  },
  {
    href: "/coin",
    label: "Search",
    match: (p) => p.startsWith("/coin"),
    icon: (a) => <IconSearch active={a} />,
  },
];

export function MobileTabBar() {
  const pathname = usePathname() || "/";

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#0a0a0a]/96 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="grid grid-cols-4">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={`flex min-h-12 flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[10px] font-semibold ${
                  active ? "text-teal-300" : "text-zinc-500"
                }`}
              >
                {tab.icon(active)}
                <span className="leading-none">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
