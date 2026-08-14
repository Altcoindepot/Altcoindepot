"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ds } from "@/lib/ui-classes";

export function RiskDisclaimerModal({
  storageKey,
  badge,
  title,
  children,
}: {
  storageKey: string;
  badge: string;
  title: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const acceptRef = useRef<HTMLButtonElement>(null);
  const titleId = `${storageKey}-title`;
  const bodyId = `${storageKey}-body`;

  useEffect(() => {
    try {
      if (localStorage.getItem(storageKey) === "1") return;
    } catch {
      /* private mode / blocked storage — still show the disclaimer */
    }
    setOpen(true);
  }, [storageKey]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    acceptRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function accept() {
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      /* ignore quota / private-mode write failures */
    }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={bodyId}
    >
      <div className="w-full max-w-md rounded-2xl border border-white/12 bg-[#0b0d11] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:p-6">
        <p className={`${ds.badgeWarn} mb-3`}>{badge}</p>
        <h2 id={titleId} className="text-lg font-semibold text-zinc-50">
          {title}
        </h2>
        <div id={bodyId} className="mt-3 space-y-3 text-sm leading-relaxed text-zinc-400">
          {children}
        </div>
        <button
          ref={acceptRef}
          type="button"
          onClick={accept}
          className={`${ds.btnPrimary} mt-6 w-full min-h-12`}
        >
          I understand
        </button>
        <p className={`${ds.disclaimer} mt-3 text-center`}>
          Informational only · not financial advice
        </p>
      </div>
    </div>
  );
}
