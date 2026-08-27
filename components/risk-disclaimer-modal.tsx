"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ds } from "@/lib/ui-classes";

function readAccepted(keys: string[]): boolean {
  try {
    return keys.some((key) => localStorage.getItem(key) === "1");
  } catch {
    return false;
  }
}

/**
 * First-visit risk notice. Does not gate the page — content stays usable;
 * persistent footnotes carry the required disclaimer copy.
 */
export function RiskDisclaimerModal({
  storageKey,
  legacyKeys = [],
  badge,
  title,
  children,
}: {
  /** Primary key written on accept (shared across DEX list/scanner pages). */
  storageKey: string;
  /** Older keys that still count as accepted so users are not re-prompted. */
  legacyKeys?: string[];
  badge: string;
  title: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const acceptRef = useRef<HTMLButtonElement>(null);
  const titleId = `${storageKey}-title`;
  const bodyId = `${storageKey}-body`;

  useEffect(() => {
    if (readAccepted([storageKey, ...legacyKeys])) return;
    setOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional join
  }, [storageKey, legacyKeys.join("|")]);

  useEffect(() => {
    if (!open) return;
    acceptRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function accept() {
    try {
      localStorage.setItem(storageKey, "1");
      for (const key of legacyKeys) {
        localStorage.setItem(key, "1");
      }
    } catch {
      /* ignore quota / private-mode write failures */
    }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[80] flex justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4"
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      aria-describedby={bodyId}
    >
      <div className="pointer-events-auto w-full max-w-lg rounded-2xl border border-amber-400/30 bg-[#0b0d11]/95 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-5">
        <p className={`${ds.badgeWarn} mb-2`}>{badge}</p>
        <h2 id={titleId} className="text-base font-semibold text-zinc-50 sm:text-lg">
          {title}
        </h2>
        <div id={bodyId} className="mt-2 max-h-40 space-y-2 overflow-y-auto text-sm leading-relaxed text-zinc-400 sm:max-h-none">
          {children}
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            ref={acceptRef}
            type="button"
            onClick={accept}
            className={`${ds.btnPrimary} min-h-11 flex-1`}
          >
            I understand
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="min-h-11 flex-1 rounded-full border border-white/15 px-4 text-sm font-medium text-zinc-300 hover:bg-white/[0.04]"
          >
            Dismiss
          </button>
        </div>
        <p className={`${ds.disclaimer} mt-2 text-center`}>
          Informational only · not financial advice
        </p>
      </div>
    </div>
  );
}
