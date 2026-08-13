"use client";

import Image from "next/image";
import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { loadClientTop200Index } from "@/lib/client-top-200-index";
import { resolveNarrativeTags } from "@/lib/coin-narratives";
import { formatCompactUsd } from "@/lib/format-compact-usd";
import {
  rotationSignalLabel,
  rotationStatusFromChange,
  statusBadgeClass,
} from "@/lib/narratives";
import { ds } from "@/lib/ui-classes";
import type { TopCoinSearchEntry } from "@/lib/top-coins-search-utils";

function formatPct(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function CompareColumn({
  label,
  value,
  coins,
  onChange,
}: {
  label: string;
  value: string;
  coins: TopCoinSearchEntry[];
  onChange: (id: string) => void;
}) {
  const selectId = useId();
  return (
    <div className="min-w-0">
      <label htmlFor={selectId} className={`${ds.label} mb-2 block`}>
        {label}
      </label>
      <select
        id={selectId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[44px] w-full rounded-lg border border-white/15 bg-[#0c0e14] px-3 py-2.5 text-sm text-zinc-100 focus:border-teal-400/50 focus:outline-none focus:ring-2 focus:ring-teal-400/25"
      >
        <option value="">Select token…</option>
        {coins.map((coin) => (
          <option key={coin.id} value={coin.id}>
            {coin.name} ({coin.symbol.toUpperCase()})
          </option>
        ))}
      </select>
    </div>
  );
}

function AssetHeader({ coin }: { coin: TopCoinSearchEntry }) {
  const tags = resolveNarrativeTags({ id: coin.id });
  return (
    <div className="flex items-center gap-3">
      {coin.image ? (
        <Image src={coin.image} alt="" width={40} height={40} className="rounded-full" />
      ) : (
        <span className="size-10 rounded-full bg-zinc-800" />
      )}
      <div className="min-w-0">
        <p className="truncate text-lg font-bold text-zinc-50">{coin.name}</p>
        <p className="font-mono text-xs uppercase text-zinc-500">{coin.symbol}</p>
      </div>
      {tags[0] ? (
        <span className={`${ds.badgeInfo} ml-auto shrink-0`}>{tags[0]}</span>
      ) : null}
    </div>
  );
}

function MetricRow({
  label,
  left,
  right,
}: {
  label: string;
  left: ReactNode;
  right: ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 border-t border-white/10 py-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
      <div className="text-sm text-zinc-100 sm:text-right">{left}</div>
      <p className="text-center text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <div className="text-sm text-zinc-100">{right}</div>
    </div>
  );
}

function change7d(coin: TopCoinSearchEntry): number | null {
  return coin.price_change_percentage_7d ?? coin.price_change_percentage_24h;
}

function rotationFor(coin: TopCoinSearchEntry) {
  const change = change7d(coin);
  const status = rotationStatusFromChange(
    change,
    coin.price_change_percentage_7d != null ? "7d" : "24h",
  );
  return { status, label: rotationSignalLabel(status) };
}

export function AssetCompareModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [coins, setCoins] = useState<TopCoinSearchEntry[]>([]);
  const [leftId, setLeftId] = useState("bitcoin");
  const [rightId, setRightId] = useState("");

  useEffect(() => {
    if (!open) return;
    void loadClientTop200Index().then((list) => setCoins(list));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const byId = useMemo(() => new Map(coins.map((c) => [c.id, c])), [coins]);
  const left = leftId ? byId.get(leftId) : undefined;
  const right = rightId ? byId.get(rightId) : undefined;
  const ready = Boolean(left && right);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-assets-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/12 bg-[#0b0d11] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="compare-assets-title" className="text-lg font-semibold text-zinc-50">
              Compare Assets
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Side-by-side signals from the cached top 200 — no extra market API calls.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-white/15 text-lg text-zinc-300 hover:bg-white/5"
            aria-label="Close compare modal"
          >
            ×
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <CompareColumn label="Left column" value={leftId} coins={coins} onChange={setLeftId} />
          <CompareColumn label="Right column" value={rightId} coins={coins} onChange={setRightId} />
        </div>

        {!ready ? (
          <p className="mt-8 text-center text-sm text-zinc-500">
            Select a secondary token to evaluate relative performance signals side-by-side.
          </p>
        ) : (
          <div className="mt-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <AssetHeader coin={left!} />
              <AssetHeader coin={right!} />
            </div>
            <MetricRow
              label="Parent Narrative"
              left={resolveNarrativeTags({ id: left!.id })[0] ?? "—"}
              right={resolveNarrativeTags({ id: right!.id })[0] ?? "—"}
            />
            <MetricRow
              label="Market Cap"
              left={formatCompactUsd(left!.market_cap)}
              right={formatCompactUsd(right!.market_cap)}
            />
            <MetricRow
              label="24h Volume"
              left={formatCompactUsd(left!.total_volume)}
              right={formatCompactUsd(right!.total_volume)}
            />
            <MetricRow
              label="7D Price Change"
              left={
                <span
                  className={
                    (change7d(left!) ?? 0) >= 0
                      ? "font-semibold text-[#6ee7b7]"
                      : "font-semibold text-[#fb7185]"
                  }
                >
                  {formatPct(change7d(left!))}
                </span>
              }
              right={
                <span
                  className={
                    (change7d(right!) ?? 0) >= 0
                      ? "font-semibold text-[#6ee7b7]"
                      : "font-semibold text-[#fb7185]"
                  }
                >
                  {formatPct(change7d(right!))}
                </span>
              }
            />
            <MetricRow
              label="Rotation Signal"
              left={
                <span className={`${ds.badge} ${statusBadgeClass(rotationFor(left!).status)}`}>
                  {rotationFor(left!).label}
                </span>
              }
              right={
                <span className={`${ds.badge} ${statusBadgeClass(rotationFor(right!).status)}`}>
                  {rotationFor(right!).label}
                </span>
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function CompareAssetsButton({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${ds.btnPrimary} min-h-[44px] px-4 ${className}`.trim()}
      >
        Compare Assets
      </button>
      <AssetCompareModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
