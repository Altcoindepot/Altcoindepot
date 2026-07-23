"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { usePriceAlerts } from "@/components/use-price-alerts";
import { removeAlert, updateAlert } from "@/lib/alerts-storage";

function formatUsd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n < 1 ? 6 : 2,
  }).format(n);
}

export default function AlertsPage() {
  const { alerts, mounted } = usePriceAlerts();
  const [note, setNote] = useState<string | null>(null);

  async function enableNotifications() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNote("This browser does not support notifications.");
      return;
    }
    const permission = await Notification.requestPermission();
    setNote(
      permission === "granted"
        ? "Notifications allowed."
        : "Notifications blocked — enable them in browser settings.",
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold text-white">Price alerts</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Browser notifications when a coin crosses your target. Alerts are checked while this site
          is open in a tab. Data stays on this device.
        </p>
        <button
          type="button"
          onClick={() => void enableNotifications()}
          className="mt-4 rounded-lg border border-[#d1a173]/45 bg-[#d1a173]/10 px-3 py-1.5 text-xs font-semibold text-[#d7ad82]"
        >
          Allow browser notifications
        </button>
        {note ? <p className="mt-2 text-xs text-zinc-400">{note}</p> : null}

        {!mounted ? (
          <p className="mt-8 text-sm text-zinc-500">Loading…</p>
        ) : alerts.length === 0 ? (
          <p className="mt-8 rounded-lg border border-white/10 bg-[#111111] p-6 text-sm text-zinc-400">
            No alerts yet. Open any{" "}
            <Link href="/" className="text-[#d7ad82] underline-offset-2 hover:underline">
              coin page
            </Link>{" "}
            and use “Set price alert”.
          </p>
        ) : (
          <ul className="mt-8 space-y-2">
            {alerts.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-[#f4ddc3]/15 bg-[#0f131b]/70 px-3 py-3"
              >
                <Link
                  href={`/coin/${encodeURIComponent(a.coinId)}`}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  {a.image ? (
                    <Image src={a.image} alt="" width={28} height={28} className="rounded-full" />
                  ) : null}
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-bold uppercase text-zinc-100">
                      {a.symbol}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {a.direction === "above" ? "Above" : "Below"} {formatUsd(a.targetUsd)}
                    </p>
                    <p className="text-[10px] text-zinc-600">
                      {a.triggeredAt
                        ? `Triggered ${new Date(a.triggeredAt).toLocaleString()}`
                        : a.enabled
                          ? "Active"
                          : "Paused"}
                    </p>
                  </div>
                </Link>
                <div className="flex gap-2">
                  {!a.triggeredAt ? (
                    <button
                      type="button"
                      onClick={() => updateAlert(a.id, { enabled: !a.enabled })}
                      className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-zinc-300"
                    >
                      {a.enabled ? "Pause" : "Resume"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        updateAlert(a.id, { enabled: true, triggeredAt: null })
                      }
                      className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-zinc-300"
                    >
                      Reset
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeAlert(a.id)}
                    className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-zinc-400 hover:border-red-400/40 hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
