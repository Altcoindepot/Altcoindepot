"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type InfoTooltipProps = {
  /** Explainer copy shown in the floating panel. */
  text: string;
  /** Accessible name for the trigger (e.g. "About Market Regime"). */
  label: string;
  className?: string;
  children?: ReactNode;
};

/**
 * Lightweight (i) tooltip — hover on desktop, tap to toggle on mobile.
 * Renders the panel in a portal with high z-index so tables cannot clip it.
 */
export function InfoTooltip({ text, label, className = "", children }: InfoTooltipProps) {
  const tipId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    place: "above" | "below";
  }>({ top: 0, left: 0, place: "below" });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setVisible(false);
      return;
    }
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [open]);

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el || typeof window === "undefined") return;
    const r = el.getBoundingClientRect();
    const preferBelow = r.bottom + 112 < window.innerHeight;
    const left = Math.min(Math.max(r.left + r.width / 2, 152), window.innerWidth - 152);
    setCoords({
      top: preferBelow ? r.bottom + 8 : r.top - 8,
      left,
      place: preferBelow ? "below" : "above",
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    function onScrollOrResize() {
      updatePosition();
    }
    function onPointerDown(e: PointerEvent) {
      const t = e.target as Node | null;
      if (triggerRef.current?.contains(t)) return;
      const tip = document.getElementById(tipId);
      if (tip?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, tipId, updatePosition]);

  const panel =
    mounted && open
      ? createPortal(
          <div
            id={tipId}
            role="tooltip"
            style={{
              top: coords.top,
              left: coords.left,
              transform:
                coords.place === "below"
                  ? "translate(-50%, 0)"
                  : "translate(-50%, -100%)",
            }}
            className={`pointer-events-none fixed z-[200] max-w-xs rounded-lg border border-white/10 bg-[#12161f] px-3 py-2.5 text-left text-[11px] leading-relaxed text-zinc-300 shadow-[0_12px_40px_rgba(0,0,0,0.55)] transition-opacity duration-200 ${
              visible ? "opacity-100" : "opacity-0"
            }`}
          >
            {text}
          </div>,
          document.body,
        )
      : null;

  return (
    <span className={`relative inline-flex items-center ${className}`.trim()}>
      {children}
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-describedby={open ? tipId : undefined}
        aria-expanded={open}
        onMouseEnter={() => {
          updatePosition();
          setOpen(true);
        }}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => {
          updatePosition();
          setOpen(true);
        }}
        onBlur={() => setOpen(false)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          updatePosition();
          setOpen((v) => !v);
        }}
        className="ml-1 inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-zinc-600/80 bg-zinc-800/60 text-[9px] font-semibold leading-none text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400"
      >
        i
      </button>
      {panel}
    </span>
  );
}
