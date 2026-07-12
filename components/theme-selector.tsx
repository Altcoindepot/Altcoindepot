"use client";

import { useEffect, useState } from "react";
import {
  persistTheme,
  readStoredTheme,
  type Theme,
} from "@/lib/theme";

const options: { value: Theme; label: string; icon: "sun" | "moon" }[] = [
  { value: "light", label: "Light", icon: "sun" },
  { value: "dark", label: "Dark", icon: "moon" },
];

function ThemeIcon({ kind }: { kind: "sun" | "moon" }) {
  if (kind === "sun") {
    return (
      <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3a6.5 6.5 0 1 0 11.5 11.5Z" strokeLinejoin="round" />
    </svg>
  );
}

export function ThemeSelector() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(readStoredTheme());
    setMounted(true);

    function syncTheme() {
      setTheme(readStoredTheme());
    }

    window.addEventListener("theme-change", syncTheme);
    window.addEventListener("storage", syncTheme);
    return () => {
      window.removeEventListener("theme-change", syncTheme);
      window.removeEventListener("storage", syncTheme);
    };
  }, []);

  if (!mounted) {
    return (
      <div className="mt-1 border-t border-[#f4ddc3]/15 pt-3" aria-hidden>
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-widest text-[#d7ad82]">
          Appearance
        </p>
        <div className="mx-1 grid grid-cols-2 gap-1 rounded-lg border border-white/10 bg-black/20 p-1">
          {options.map((opt) => (
            <div
              key={opt.value}
              className="flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-medium text-zinc-400"
            >
              <ThemeIcon kind={opt.icon} />
              {opt.label}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-1 border-t border-[#f4ddc3]/15 pt-3">
      <p
        id="theme-selector-label"
        className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-widest text-[#d7ad82]"
      >
        Appearance
      </p>
      <div
        role="radiogroup"
        aria-labelledby="theme-selector-label"
        className="mx-1 grid grid-cols-2 gap-1 rounded-lg border border-white/10 bg-black/20 p-1"
      >
        {options.map((opt) => {
          const active = theme === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => {
                persistTheme(opt.value);
                setTheme(opt.value);
              }}
              className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1a173] ${
                active
                  ? "bg-[#d1a173]/25 text-zinc-100 ring-1 ring-[#d1a173]/45"
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
              }`}
            >
              <ThemeIcon kind={opt.icon} />
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
