"use client";

import { useEffect, useState } from "react";
import {
  persistThemePreference,
  readStoredPreference,
  type ThemePreference,
} from "@/lib/theme";

const options: {
  value: ThemePreference;
  label: string;
  icon: "system" | "sun" | "moon";
}[] = [
  { value: "system", label: "System", icon: "system" },
  { value: "light", label: "Light", icon: "sun" },
  { value: "dark", label: "Dark", icon: "moon" },
];

function ThemeIcon({ kind }: { kind: "system" | "sun" | "moon" }) {
  if (kind === "sun") {
    return (
      <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === "moon") {
    return (
      <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3a6.5 6.5 0 1 0 11.5 11.5Z" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" strokeLinecap="round" />
    </svg>
  );
}

export function ThemeSelector() {
  const [preference, setPreference] = useState<ThemePreference>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setPreference(readStoredPreference());
    setMounted(true);

    function sync() {
      setPreference(readStoredPreference());
    }

    window.addEventListener("theme-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("theme-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const shell = (
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
        className="mx-1 grid grid-cols-3 gap-1 rounded-lg border border-white/10 bg-black/20 p-1"
      >
        {options.map((opt) => {
          const active = mounted && preference === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={!mounted}
              onClick={() => {
                persistThemePreference(opt.value);
                setPreference(opt.value);
              }}
              className={`flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-md px-1 py-2 text-[11px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1a173] sm:text-xs ${
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
      <p className="px-3 pt-2 text-[10px] leading-relaxed text-zinc-500">
        Choice is saved on this device. System follows your OS setting.
      </p>
    </div>
  );

  return shell;
}
