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

function IconNews({ active }: { active: boolean }) {
  return (
    <svg
      className="size-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.25 : 1.75}
      aria-hidden
    >
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H16v14.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 4 18.5V5.5Z" />
      <path d="M16 6h2.5A1.5 1.5 0 0 1 20 7.5v11A1.5 1.5 0 0 1 18.5 20H16" strokeLinecap="round" />
      <path d="M7 8h6M7 11h6M7 14h4" strokeLinecap="round" />
    </svg>
  );
}

function IconPodcasts({ active }: { active: boolean }) {
  return (
    <svg
      className="size-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.25 : 1.75}
      aria-hidden
    >
      <path d="M12 3a5 5 0 0 0-5 5v3a5 5 0 0 0 10 0V8a5 5 0 0 0-5-5Z" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" strokeLinecap="round" />
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
    href: "/news",
    label: "News",
    match: (p) => p.startsWith("/news"),
    icon: (a) => <IconNews active={a} />,
  },
  {
    href: "/podcasts",
    label: "Podcasts",
    match: (p) => p.startsWith("/podcasts"),
    icon: (a) => <IconPodcasts active={a} />,
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
];

/** Mobile IA — floating wet-glass capsule matching the desktop header chrome. */
export function MobileTabBar() {
  const pathname = usePathname() || "/";

  return (
    <nav
      aria-label="Primary"
      className="mobile-tab-bar fixed inset-x-2.5 bottom-[max(0.55rem,env(safe-area-inset-bottom))] z-50 overflow-hidden lg:hidden sm:inset-x-4"
    >
      <ul className="grid grid-cols-5">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={`flex min-h-12 flex-col items-center justify-center gap-0.5 px-0.5 py-1.5 text-[9px] font-semibold sm:text-[10px] ${
                  active ? "tab-active" : "site-tab-idle"
                }`}
              >
                <span
                  className={`inline-flex size-8 items-center justify-center ${
                    active ? "tab-active-icon" : ""
                  }`}
                >
                  {tab.icon(active)}
                </span>
                <span className="leading-none">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
