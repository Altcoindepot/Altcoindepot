import type { ReppoStatsSnapshot } from "@/lib/reppo-stats-data";

const accentMuted = "rgba(0,255,159,0.35)";
const purpleMuted = "rgba(168,85,247,0.45)";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function parseMillionsRough(label: string): number {
  const m = label.match(/([\d.]+)\s*M\b/i);
  return m ? Number(m[1]) : 0;
}

function ReppoSparkline({ points, color = "#00ff9f" }: { points: number[]; color?: string }) {
  const width = 200;
  const height = 48;
  if (!points.length) {
    return <div className="mt-3 h-12 rounded-md border border-white/10 bg-[#0a0a0a]" />;
  }
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = points.length > 1 ? width / (points.length - 1) : width;
  const polyline = points
    .map((p, i) => {
      const x = i * step;
      const y = height - ((p - min) / range) * (height - 6) - 3;
      return `${x},${y}`;
    })
    .join(" ");
  const gradId = "reppo-spark-fill";
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="mt-3 h-12 w-full rounded-md border border-white/10 bg-[#0a0a0a]"
      role="img"
      aria-label="User activity trend"
    >
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${polyline} ${width},${height}`} fill={`url(#${gradId})`} />
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StatCard({
  eyebrow,
  title,
  children,
  aside,
}: {
  eyebrow: string;
  title: React.ReactNode;
  children?: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#101217] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{eyebrow}</p>
        {aside}
      </div>
      <div className="mt-1 text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">{title}</div>
      {children ? <div className="mt-2">{children}</div> : null}
    </div>
  );
}

function StackedFeeBar({ fees }: { fees: ReppoStatsSnapshot["fees"] }) {
  const s = fees;
  return (
    <div className="mt-4">
      <div className="flex h-3 overflow-hidden rounded-full border border-white/10 bg-zinc-900">
        <div
          className="bg-gradient-to-b from-rose-400/90 to-rose-600/80"
          style={{ width: `${s.burntPct}%` }}
          title={`Burnt ${s.burntPct}%`}
        />
        <div
          className="bg-gradient-to-b from-violet-400/90 to-violet-700/80"
          style={{ width: `${s.performancePct}%` }}
          title={`Performance ${s.performancePct}%`}
        />
        <div
          className="bg-gradient-to-b from-emerald-400/90 to-emerald-700/80"
          style={{ width: `${s.lockedPct}%` }}
          title={`Locked ${s.lockedPct}%`}
        />
      </div>
      <div className="mt-3 grid gap-2 text-[11px] text-zinc-400 sm:grid-cols-3">
        <div className="rounded-lg border border-white/10 bg-[#0d0f14] px-2.5 py-2">
          <p className="font-medium text-rose-300/90">Burnt</p>
          <p className="mt-0.5 font-mono text-zinc-200">{s.burntReppo}</p>
          <p className="text-zinc-500">{s.burntPct}% of fees</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-[#0d0f14] px-2.5 py-2">
          <p className="font-medium text-violet-300/90">Performance pool</p>
          <p className="mt-0.5 font-mono text-zinc-200">{s.performancePoolReppo}</p>
          <p className="text-zinc-500">{s.performancePct}% of fees</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-[#0d0f14] px-2.5 py-2">
          <p className="font-medium text-emerald-300/90">Locked</p>
          <p className="mt-0.5 font-mono text-zinc-200">{s.lockedReppo}</p>
          <p className="text-zinc-500">{s.lockedPct}% of fees</p>
        </div>
      </div>
    </div>
  );
}

function LockDonut({ locks }: { locks: ReppoStatsSnapshot["locks"] }) {
  const L = locks;
  const govAmt = parseMillionsRough(L.governanceReppo);
  const commAmt = parseMillionsRough(L.communityReppo);
  const total = govAmt + commAmt || 1;
  const govDeg = (govAmt / total) * 360;
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-center sm:gap-10">
      <div
        className="relative grid size-40 shrink-0 place-items-center rounded-full border border-white/10 p-1"
        style={{
          background: `conic-gradient(from -90deg, ${purpleMuted} 0deg ${govDeg}deg, ${accentMuted} ${govDeg}deg 360deg)`,
        }}
      >
        <div className="flex size-[5.25rem] flex-col items-center justify-center rounded-full bg-[#101217] text-center">
          <span className="text-[9px] font-semibold uppercase tracking-wide text-zinc-500">Locked</span>
          <span className="text-xs font-bold text-zinc-100">REPPO</span>
        </div>
      </div>
      <div className="max-w-md space-y-2 text-sm leading-relaxed text-zinc-400">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[#a855f7]" />
            <span className="text-zinc-300">
              Governance {L.governanceLockPctOfCirculating.toFixed(1)}%
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[#00ff9f]" />
            <span className="text-zinc-300">
              Community {L.communityLockPctOfCirculating.toFixed(1)}%
            </span>
          </span>
        </div>
        <p>{L.lockRateBlurb}</p>
        <p className="text-[11px] text-zinc-500">
          Community: <span className="font-mono text-zinc-300">{L.communityReppo}</span> · Governance:{" "}
          <span className="font-mono text-zinc-300">{L.governanceReppo}</span>
        </p>
      </div>
    </div>
  );
}

function SentimentStrip({ score }: { score: number }) {
  const pct = clamp(score, 0, 100);
  return (
    <div className="mt-3 rounded-md border border-white/10 bg-[#0a0a0a] p-2">
      <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Community sentiment</p>
      <div className="relative mt-2 h-2 rounded-full bg-gradient-to-r from-red-500/50 via-zinc-600 to-emerald-400/80">
        <span
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#00ff9f]/60 bg-[#00ff9f] shadow-[0_0_12px_rgba(0,255,159,0.45)]"
          style={{ left: `${pct}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-zinc-500">
        <span>Bearish</span>
        <span className="font-mono text-zinc-300">{score}</span>
        <span className="text-emerald-400/90">Bullish</span>
      </div>
    </div>
  );
}

export function ReppoStatsSection({ data }: { data: ReppoStatsSnapshot }) {
  const d = data;
  const u = d.users;
  const h = d.headlineUsd;
  const L = d.locks;
  const v = d.datanetV2;
  const sentiment = d.sentimentScore ?? 50;

  return (
    <section
      id="reppo-network-stats"
      aria-labelledby="reppo-network-stats-heading"
      className="mt-8 rounded-xl border border-[#00ff9f]/20 bg-gradient-to-b from-[#101217] to-[#0a0a0a] p-4 sm:p-6"
    >
      <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#00ff9f]/80">
            Reppo network
          </p>
          <h2
            id="reppo-network-stats-heading"
            className="mt-1 text-xl font-bold tracking-tight text-white sm:text-2xl"
          >
            Network activity
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-zinc-400">
            Same metrics as{" "}
            <a
              href={d.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#00ff9f] underline-offset-2 hover:underline"
            >
              ReppoStats
            </a>{" "}
            — pulled from their public page on each refresh.
          </p>
        </div>
        <a
          href="https://www.reppostats.com/analytics"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-white/15 bg-[#111111] px-3 py-2 text-xs font-semibold text-zinc-200 transition-colors hover:border-[#a855f7]/40 hover:text-white"
        >
          Datanet analytics
          <span className="text-zinc-500" aria-hidden>
            ↗
          </span>
        </a>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">{d.lastUpdatedNote}</p>

      <a
        href="https://www.reppostats.com/analytics"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#111111] px-3 py-2.5 text-center text-xs text-zinc-400 transition-colors hover:border-[#00ff9f]/30 hover:text-zinc-200"
      >
        <span className="font-semibold text-[#00ff9f]">Datanet activity</span>
        <span>is live on ReppoStats — per-datanet voting, emissions, and network share.</span>
      </a>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          eyebrow="Total users"
          title={u.totalUsersDisplay ?? "—"}
          aside={
            <span className="text-[11px] font-medium text-emerald-400/90">
              ▲ {u.weekOverWeekPct}% <span className="text-zinc-500">from last week</span>
            </span>
          }
        >
          <p className="text-sm font-medium text-emerald-400/90">+{u.newThisWeek} new users this week</p>
          <ReppoSparkline points={u.activitySeries} />
        </StatCard>

        <StatCard eyebrow="Total REPPO locked" title={h.totalReppoLocked}>
          <p className="text-sm font-medium text-[#00ff9f]/90">{h.totalReppoLockedUsd}</p>
        </StatCard>

        <StatCard eyebrow="Total volume traded" title={h.totalVolumeTraded}>
          <p className="text-sm font-medium text-[#00ff9f]/90">{h.totalVolumeTradedUsd}</p>
          <p className="text-xs text-zinc-500">{h.volumeSubline}</p>
        </StatCard>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard eyebrow="Total locks" title={L.totalLocks} />
        <StatCard eyebrow="Avg lock per user" title={L.avgLockPerUser}>
          <p className="text-sm text-zinc-400">
            <span className="font-mono text-zinc-200">{L.avgLockUsd}</span> USD
          </p>
        </StatCard>
        <StatCard
          eyebrow="Sentiment"
          title={<span className="text-3xl font-bold text-zinc-50">{sentiment}</span>}
        >
          <SentimentStrip score={sentiment} />
        </StatCard>
      </div>

      <div className="mt-10">
        <h3 className="text-lg font-semibold text-zinc-100">Locked REPPO</h3>
        <div className="mt-4 rounded-xl border border-white/10 bg-[#111111] p-4 sm:p-6">
          <LockDonut locks={L} />
          <div className="mt-8 border-t border-white/10 pt-6">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Total value locked
            </p>
            <p className="mt-1 font-mono text-2xl font-bold text-zinc-50">
              {L.totalLockedReppo} <span className="text-base font-normal text-zinc-500">REPPO</span>
            </p>
            <p className="text-sm text-[#00ff9f]/90">{L.totalLockedUsd}</p>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-[#0d0f14] px-3 py-2.5">
                <dt className="text-[10px] uppercase tracking-wide text-zinc-500">TVL (governance lock)</dt>
                <dd className="mt-1 font-mono text-sm text-zinc-100">{L.tvlGovernanceReppo}</dd>
                <dd className="text-xs text-zinc-400">{L.tvlGovernanceUsd}</dd>
              </div>
              <div className="rounded-lg border border-white/10 bg-[#0d0f14] px-3 py-2.5">
                <dt className="text-[10px] uppercase tracking-wide text-zinc-500">TVL (Reppo.ai users)</dt>
                <dd className="mt-1 font-mono text-sm text-zinc-100">{L.tvlUsersReppo}</dd>
                <dd className="text-xs text-zinc-400">{L.tvlUsersUsd}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h3 className="text-lg font-semibold text-zinc-100">Datanet fee breakdown</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Total fees collected:{" "}
          <span className="font-mono text-zinc-300">{d.fees.totalCollectedReppo}</span> ·{" "}
          <span className="text-zinc-400">{d.fees.totalCollectedUsd}</span>
        </p>
        <div className="mt-4 rounded-xl border border-white/10 bg-[#111111] p-4 sm:p-5">
          <StackedFeeBar fees={d.fees} />
        </div>
      </div>

      <div className="mt-10">
        <h3 className="text-lg font-semibold text-zinc-100">Datanet activity (V2)</h3>
        <p className="mt-1 text-sm text-zinc-500">Cumulative voting activity since V2 launch</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total volume traded", a: v.totalVolumeTraded, b: v.totalVolumeUsd },
            { label: "Total agreements", a: v.totalAgreements, b: v.agreementsUsd },
            { label: "Total disagreements", a: v.totalDisagreements, b: v.disagreementsUsd },
            { label: "Emissions / epoch", a: v.emissionsPerEpochReppo, b: v.emissionsPerEpochUsd },
          ].map((c) => (
            <div key={c.label} className="rounded-xl border border-white/10 bg-[#101217] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{c.label}</p>
              <p className="mt-2 font-mono text-lg font-bold text-zinc-50">{c.a}</p>
              <p className="text-xs text-zinc-400">{c.b}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-white/10 bg-[#111111]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-[11px]">
            <thead>
              <tr className="border-b border-white/10 bg-[#0d0f14] text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                <th className="px-3 py-2.5">Datanet</th>
                <th className="px-3 py-2.5">Network share</th>
                <th className="px-3 py-2.5">EVOFi</th>
                <th className="px-3 py-2.5">Volume</th>
                <th className="px-3 py-2.5">Agreements</th>
                <th className="px-3 py-2.5">Disagreements</th>
                <th className="px-3 py-2.5">Emissions / epoch</th>
              </tr>
            </thead>
            <tbody>
              {d.datanets.map((row) => (
                <tr key={row.name} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="max-w-[220px] px-3 py-2 align-top text-zinc-200">{row.name}</td>
                  <td className="px-3 py-2 align-top">
                    <div className="flex items-center gap-2">
                      <span className="w-10 shrink-0 font-mono text-zinc-300">{row.networkSharePct}%</span>
                      <div className="h-1.5 min-w-[48px] flex-1 rounded-full bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#a855f7]/80 to-[#00ff9f]/70"
                          style={{ width: `${clamp(row.networkSharePct, 0, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 font-mono text-zinc-400">{row.evoFi}</td>
                  <td className="px-3 py-2 font-mono text-zinc-300">{row.volumeTraded}</td>
                  <td className="px-3 py-2 font-mono text-zinc-300">{row.agreements}</td>
                  <td className="px-3 py-2 font-mono text-zinc-300">{row.disagreements}</td>
                  <td className="px-3 py-2 font-mono text-zinc-400">{row.emissionsPerEpoch}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-6 text-center text-[11px] text-zinc-600">
        Numbers mirror{" "}
        <a className="text-zinc-500 underline-offset-2 hover:text-[#00ff9f] hover:underline" href={d.sourceUrl}>
          ReppoStats
        </a>
        . Not financial advice.
      </p>
    </section>
  );
}
