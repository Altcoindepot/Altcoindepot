"use client";

import type { CSSProperties } from "react";
import type { LaunchPulseBucketId, LaunchPulseNode } from "@/lib/launch-pulse";
import { ds } from "@/lib/ui-classes";

/** Desktop orbital Launch Pulse — same graphic language as the rotation tracker, launch-framed. */
function LaunchPulseOrbit({
  nodes,
  active,
  onSelect,
}: {
  nodes: LaunchPulseNode[];
  active: LaunchPulseBucketId | null;
  onSelect: (id: LaunchPulseBucketId | null) => void;
}) {
  const size = 480;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 168;

  return (
    <section
      aria-labelledby="launch-pulse-heading"
      className={`${ds.panelLg} relative hidden min-h-[22rem] flex-col overflow-visible md:flex`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="launch-pulse-heading" className="text-base font-semibold text-zinc-100">
          Launch Pulse
          <span className="ml-2 text-xs font-medium text-teal-300/80">· Last 60m</span>
        </h2>
        <p className="text-[10px] uppercase tracking-wider text-zinc-500">
          Pumping → Dumping → High liq → Fresh
        </p>
      </div>
      <p className="mt-1 max-w-xl text-xs text-zinc-500">
        At-a-glance new-pair activity. High risk — pumps and dumps are common. Informational only.
      </p>

      <div className="relative mx-auto mt-3 flex min-h-0 w-full flex-1 items-center justify-center overflow-visible px-2">
        <div className="relative aspect-square w-full max-h-full max-w-[min(100%,30rem)]">
          <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full" aria-hidden>
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke="rgba(45,212,191,0.18)"
              strokeWidth="1.5"
              strokeDasharray="4 6"
            />
            <defs>
              <marker id="launch-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="rgba(161,161,170,0.45)" />
              </marker>
            </defs>
            {nodes.map((n, i) => {
              const target = nodes[(i + 1) % nodes.length]!;
              const a0 = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
              const a1 = ((i + 1) / nodes.length) * Math.PI * 2 - Math.PI / 2;
              const x0 = cx + Math.cos(a0) * radius;
              const y0 = cy + Math.sin(a0) * radius;
              const x1 = cx + Math.cos(a1) * radius;
              const y1 = cy + Math.sin(a1) * radius;
              const hot = !n.empty && (n.id === "pumping" || n.id === "dumping");
              return (
                <line
                  key={`edge-${n.id}-${target.id}`}
                  x1={x0}
                  y1={y0}
                  x2={x1}
                  y2={y1}
                  className={
                    hot
                      ? "narrative-flow-vector narrative-flow-vector--inflow"
                      : "narrative-flow-vector"
                  }
                  stroke={hot ? n.color : "rgba(161,161,170,0.28)"}
                  strokeWidth={hot ? 1.75 : 1}
                  strokeOpacity={hot ? 0.9 : 0.65}
                  markerEnd="url(#launch-arrow)"
                  style={
                    hot
                      ? ({ filter: `drop-shadow(0 0 4px ${n.color}88)` } as CSSProperties)
                      : undefined
                  }
                />
              );
            })}
          </svg>

          <div className="absolute left-1/2 top-1/2 z-10 flex h-[9rem] w-[9rem] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-2 border-teal-400/50 bg-[radial-gradient(circle_at_30%_20%,rgba(45,212,191,0.28),rgba(10,10,10,0.96))] px-3 text-center shadow-[0_0_44px_rgba(45,212,191,0.28)] sm:h-[10rem] sm:w-[10rem]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-teal-300">
              Launch Pulse
            </p>
            <p className="mt-1 text-base font-extrabold leading-tight tracking-wide text-zinc-50 sm:text-lg">
              Last 60m
            </p>
            <p className="mt-1.5 text-[10px] font-medium text-zinc-400">New pairs only</p>
          </div>

          {nodes.map((n, i) => {
            const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
            const x = 50 + Math.cos(angle) * 36;
            const y = 50 + Math.sin(angle) * 36;
            const selected = active === n.id;
            const disabled = n.empty;

            return (
              <button
                key={n.id}
                type="button"
                disabled={disabled}
                aria-pressed={selected}
                aria-label={
                  disabled
                    ? `${n.title}: no pairs`
                    : `${n.title}: ${n.headline}, ${n.count} pairs${selected ? ", selected" : ""}`
                }
                onClick={() => onSelect(selected ? null : n.id)}
                className={`absolute z-20 flex w-[5rem] -translate-x-1/2 -translate-y-1/2 flex-col items-center overflow-visible rounded-full border bg-[#0a0a0a]/95 px-1.5 py-2 text-center shadow-[0_0_18px_var(--node-glow)] transition-all duration-300 ease-in-out xl:w-[5.5rem] ${
                  disabled
                    ? "cursor-default opacity-45"
                    : "cursor-pointer hover:z-30 hover:scale-105 hover:shadow-[0_0_28px_var(--node-glow-strong),0_0_48px_var(--node-glow)]"
                } ${selected ? "ring-2 ring-teal-300/70" : ""}`}
                style={
                  {
                    left: `${x}%`,
                    top: `${y}%`,
                    borderColor: `${n.color}${disabled ? "33" : "66"}`,
                    "--node-glow": `${n.color}33`,
                    "--node-glow-strong": `${n.color}99`,
                  } as CSSProperties
                }
              >
                {!disabled && (n.id === "pumping" || n.id === "dumping") ? (
                  <span className="absolute right-1.5 top-1.5 z-10 flex size-1.5" aria-hidden>
                    <span
                      className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                      style={{ backgroundColor: n.color }}
                    />
                    <span
                      className="relative inline-flex size-1.5 rounded-full ring-1 ring-[#0a0a0a]"
                      style={{
                        backgroundColor: n.color,
                        boxShadow: `0 0 8px ${n.color}`,
                      }}
                    />
                  </span>
                ) : null}
                <span
                  className="mb-1 h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor: n.color,
                    boxShadow: disabled ? undefined : `0 0 8px ${n.color}`,
                  }}
                  aria-hidden
                />
                <span className="text-[10px] font-semibold leading-tight text-zinc-100">
                  {n.title}
                </span>
                <span
                  className={`mt-0.5 font-mono text-[10px] font-bold tabular-nums ${
                    n.id === "dumping"
                      ? "text-red-300"
                      : n.id === "pumping"
                        ? "text-emerald-300"
                        : "text-zinc-200"
                  }`}
                >
                  {n.headline}
                </span>
                <span className="mt-1 ds-badge !h-4 !px-1.5 !text-[8px] text-zinc-400">
                  {disabled ? "Empty" : `${n.count}`}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {active ? (
        <p className="mt-2 text-center text-[11px] text-zinc-500">
          Filtering list ·{" "}
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="font-medium text-teal-300/90 underline-offset-2 hover:underline"
          >
            Clear
          </button>
        </p>
      ) : null}
    </section>
  );
}

/** Mobile chip/card summary — same buckets, no orbit. */
function LaunchPulseMobile({
  nodes,
  active,
  onSelect,
}: {
  nodes: LaunchPulseNode[];
  active: LaunchPulseBucketId | null;
  onSelect: (id: LaunchPulseBucketId | null) => void;
}) {
  return (
    <section
      aria-labelledby="launch-pulse-mobile-heading"
      className={`${ds.panel} md:hidden`}
    >
      <h2 id="launch-pulse-mobile-heading" className="text-sm font-semibold text-zinc-100">
        Launch Pulse
        <span className="ml-2 text-xs font-medium text-teal-300/80">· Last 60m</span>
      </h2>
      <p className="mt-1 text-xs text-zinc-500">
        High risk — pumps and dumps are common. Tap a chip to filter the list.
      </p>
      <ul className="mt-3 grid grid-cols-2 gap-2">
        {nodes.map((n) => {
          const selected = active === n.id;
          const disabled = n.empty;
          return (
            <li key={n.id}>
              <button
                type="button"
                disabled={disabled}
                aria-pressed={selected}
                onClick={() => onSelect(selected ? null : n.id)}
                className={`flex min-h-[44px] w-full flex-col items-start rounded-xl border px-3 py-2.5 text-left transition-colors ${
                  disabled
                    ? "cursor-default border-white/5 bg-[#0c0e14]/60 opacity-50"
                    : selected
                      ? "border-teal-400/40 bg-teal-500/10"
                      : "border-white/10 bg-[#0c0e14] hover:border-white/20 hover:bg-white/[0.04]"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: n.color }}
                    aria-hidden
                  />
                  <span className="text-xs font-semibold text-zinc-100">{n.title}</span>
                </span>
                <span
                  className={`mt-1 font-mono text-sm font-bold tabular-nums ${
                    n.id === "dumping"
                      ? "text-red-300"
                      : n.id === "pumping"
                        ? "text-emerald-300"
                        : "text-zinc-200"
                  }`}
                >
                  {n.headline}
                </span>
                <span className="mt-0.5 text-[10px] text-zinc-500">
                  {disabled ? "No pairs" : `${n.count} pairs`}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {active ? (
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="mt-3 text-[11px] font-medium text-teal-300/90 underline-offset-2 hover:underline"
        >
          Clear filter
        </button>
      ) : null}
    </section>
  );
}

export function LaunchPulse({
  nodes,
  active,
  onSelect,
  className = "",
}: {
  nodes: LaunchPulseNode[];
  active: LaunchPulseBucketId | null;
  onSelect: (id: LaunchPulseBucketId | null) => void;
  className?: string;
}) {
  if (nodes.length === 0) return null;
  return (
    <div className={className}>
      <LaunchPulseOrbit nodes={nodes} active={active} onSelect={onSelect} />
      <LaunchPulseMobile nodes={nodes} active={active} onSelect={onSelect} />
    </div>
  );
}
