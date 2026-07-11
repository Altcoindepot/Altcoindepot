import { unstable_cache } from "next/cache";
import type { ReppoStatsSnapshot, ReppoDatanetRow } from "@/lib/reppo-stats-data";
import { REPPO_STATS_SNAPSHOT } from "@/lib/reppo-stats-data";

const REPPOSTATS_HOME = "https://www.reppostats.com/";

export type ParsedReppoPartial = {
  l14?: string[];
  usersSparkline?: number[];
  sentimentScore?: number;
  communityPct?: number;
  governancePct?: number;
  communityLabel?: string;
  governanceLabel?: string;
  newUsersThisWeek?: number;
  weekOverWeekPct?: number;
  lockBlurb?: string;
  updatedAt?: string;
  feeSegments?: { burnt: number; performance: number; locked: number };
  datanets?: ReppoDatanetRow[];
  headlineUsd?: Partial<ReppoStatsSnapshot["headlineUsd"]>;
  datanetV2?: Partial<ReppoStatsSnapshot["datanetV2"]>;
};

function stripComments(s: string): string {
  return s.replace(/<!--[\s\S]*?-->/g, "").trim();
}

function stripTd(html: string): string {
  return stripComments(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

/** AnimatedNumber values from ReppoStats RSC payload (document order). */
function parseL14Values(html: string): string[] {
  const re = /\$L14\\",null,\{\\\"value\\\":\\\"([^\\"]+)\\"/g;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    out.push(m[1]);
  }
  return out;
}

function parseSparkline(html: string): number[] | undefined {
  const m = html.match(/\\\"data\\\":\[([\d,]+)\]/);
  if (!m?.[1]) return undefined;
  const nums = m[1].split(",").map((x) => Number(x));
  return nums.every((n) => !Number.isNaN(n)) ? nums : undefined;
}

function parseSentimentScore(html: string): number | undefined {
  const m = html.match(/\\\"score\\\":(\d+),\\\"label\\\":\\\"Community\\\"/);
  return m?.[1] ? Number(m[1]) : undefined;
}

function parseLockPct(html: string): Pick<
  ParsedReppoPartial,
  "communityPct" | "governancePct" | "communityLabel" | "governanceLabel"
> {
  const m = html.match(
    /\\\"communityPct\\\":([\d.]+),\\\"governancePct\\\":([\d.]+),\\\"communityLabel\\\":\\\"([^\\"]+)\\\",\\\"governanceLabel\\\":\\\"([^\\"]+)\\\"/,
  );
  if (!m) return {};
  return {
    communityPct: Number(m[1]),
    governancePct: Number(m[2]),
    communityLabel: m[3],
    governanceLabel: m[4],
  };
}

function parseNewUsersWeek(html: string): number | undefined {
  const m = html.match(/\+<!-- -->(\d+)<!-- --> new users/);
  return m?.[1] ? Number(m[1]) : undefined;
}

function parseWeekOverWeek(html: string): number | undefined {
  const m = html.match(/▲<!-- -->\s*<!-- -->([\d.]+)% from last week/);
  return m?.[1] ? Number(m[1]) : undefined;
}

function parseLockBlurb(html: string): string | undefined {
  const m = html.match(
    /Lock Rate<!-- -->[\s\S]*?<p class="text-muted text-xs leading-relaxed[^"]*">([\s\S]*?)<\/p>/,
  );
  if (!m?.[1]) return undefined;
  return stripTd(m[1])
    .replace(/\s*%\s*/g, "% ")
    .replace(/\$\s*REPPO/g, "$REPPO")
    .trim();
}

function parseUpdatedAt(html: string): string | undefined {
  const m = html.match(/Updated<!-- -->\s*<!-- -->([^<]+)</);
  return m?.[1] ? stripComments(m[1]).trim() : undefined;
}

function parseFeeSegments(html: string): ParsedReppoPartial["feeSegments"] {
  const b = html.match(/Burnt\\\",\\\"value\\\":(\d+)/);
  const p = html.match(/Performance Pool\\\",\\\"value\\\":(\d+)/);
  const l = html.match(/\\\"Locked\\\",\\\"value\\\":(\d+)/);
  if (!b?.[1] || !p?.[1] || !l?.[1]) return undefined;
  return {
    burnt: Number(b[1]),
    performance: Number(p[1]),
    locked: Number(l[1]),
  };
}

/** Stat cards in the Datanet Activity section (visible HTML). */
function parseV2Grid(html: string): Partial<ReppoStatsSnapshot["datanetV2"]> | undefined {
  function card(label: string): { main?: string; sub?: string } {
    const esc = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(
      `${esc}</p><p class="text-lg font-semibold">([^<]+)</p><p class="text-xs mt-0.5 text-green">([^<]+)</p>`,
    );
    const m = html.match(re);
    if (!m) return {};
    return { main: stripComments(m[1]), sub: stripComments(m[2]) };
  }
  const vol = card("Total Volume Traded");
  const agr = card("Total Agreements");
  const dis = card("Total Disagreements");
  const em = card("Emissions / Epoch");
  if (!vol.main && !agr.main) return undefined;
  return {
    totalVolumeTraded: vol.main,
    totalVolumeUsd: vol.sub,
    totalAgreements: agr.main,
    agreementsUsd: agr.sub,
    totalDisagreements: dis.main,
    disagreementsUsd: dis.sub,
    emissionsPerEpochReppo: em.main,
    emissionsPerEpochUsd: em.sub,
  };
}

function parseHeadlineUsdFromHtml(
  html: string,
  l14: string[],
): Partial<ReppoStatsSnapshot["headlineUsd"]> | undefined {
  const locked = html.match(
    /Total REPPO Locked[\s\S]{0,900}?text-sm text-green mt-1[^>]*>([^<]+)<\/p>/,
  );
  const vol = html.match(
    /Total Volume Traded[\s\S]{0,900}?text-sm text-green mt-1[^>]*>([^<]+)<\/p>/,
  );
  const out: Partial<ReppoStatsSnapshot["headlineUsd"]> = {};
  if (l14[1]) out.totalReppoLocked = l14[1];
  if (l14[2]) out.totalVolumeTraded = l14[2];
  if (locked?.[1]) out.totalReppoLockedUsd = stripComments(locked[1]);
  if (vol?.[1]) out.totalVolumeTradedUsd = stripComments(vol[1]);
  return Object.keys(out).length ? out : undefined;
}

function parseDatanetTable(html: string): ReppoDatanetRow[] | undefined {
  const tbodyStart = html.indexOf("<tbody>");
  const tbodyEnd = html.indexOf("</tbody>", tbodyStart);
  if (tbodyStart === -1 || tbodyEnd === -1) return undefined;
  const tbody = html.slice(tbodyStart, tbodyEnd);
  const rows: ReppoDatanetRow[] = [];
  const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  let tm: RegExpExecArray | null;
  while ((tm = trRe.exec(tbody)) !== null) {
    const row = tm[1];
    const tdRe = /<td[^>]*>([\s\S]*?)<\/td>/g;
    const cells: string[] = [];
    let td: RegExpExecArray | null;
    while ((td = tdRe.exec(row)) !== null) {
      cells.push(stripTd(td[1]));
    }
    if (cells.length < 7) continue;
    const shareRaw = cells[1].replace(/%$/, "").trim();
    const share = Number.parseFloat(shareRaw);
    rows.push({
      name: cells[0],
      networkSharePct: Number.isFinite(share) ? share : 0,
      evoFi: cells[2],
      volumeTraded: cells[3],
      agreements: cells[4],
      disagreements: cells[5],
      emissionsPerEpoch: cells[6],
    });
  }
  return rows.length ? rows : undefined;
}

export function parseReppoStatsHtml(html: string): ParsedReppoPartial | null {
  const l14 = parseL14Values(html);
  if (l14.length < 5) return null;

  return {
    l14,
    usersSparkline: parseSparkline(html),
    sentimentScore: parseSentimentScore(html),
    ...parseLockPct(html),
    newUsersThisWeek: parseNewUsersWeek(html),
    weekOverWeekPct: parseWeekOverWeek(html),
    lockBlurb: parseLockBlurb(html),
    updatedAt: parseUpdatedAt(html),
    feeSegments: parseFeeSegments(html),
    datanets: parseDatanetTable(html),
    headlineUsd: parseHeadlineUsdFromHtml(html, l14),
    datanetV2: parseV2Grid(html),
  };
}

function formatFeeFromSegment(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M REPPO`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K REPPO`;
  return `${n} REPPO`;
}

export function mergeReppoLiveWithSnapshot(
  live: ParsedReppoPartial | null,
  base: ReppoStatsSnapshot = REPPO_STATS_SNAPSHOT,
): ReppoStatsSnapshot {
  if (!live?.l14 || live.l14.length < 5) {
    return {
      ...base,
      lastUpdatedNote:
        "Could not load live ReppoStats — showing last bundled snapshot. Visit reppostats.com for current figures.",
    };
  }

  const [totalUsers, reppoLocked, volTraded, totalLocks, avgLock] = live.l14;

  const spark = live.usersSparkline?.length ? live.usersSparkline : base.users.activitySeries;

  const govPct = live.governancePct ?? base.locks.governanceLockPctOfCirculating;
  const commPct = live.communityPct ?? base.locks.communityLockPctOfCirculating;
  const blurb =
    live.lockBlurb ||
    base.locks.lockRateBlurb ||
    `${commPct.toFixed(1)}% of circulating $REPPO is voluntarily locked by community members. Combined with ${govPct.toFixed(1)}% governance-locked supply, over ${Math.round(commPct + govPct)}% of circulating tokens are off the market.`;

  let fees = { ...base.fees };
  if (live.feeSegments) {
    const { burnt, performance, locked } = live.feeSegments;
    const total = burnt + performance + locked;
    if (total > 0) {
      const pct = (x: number) => Math.round((x / total) * 1000) / 10;
      fees = {
        ...fees,
        burntReppo: formatFeeFromSegment(burnt),
        performancePoolReppo: formatFeeFromSegment(performance),
        lockedReppo: formatFeeFromSegment(locked),
        burntPct: pct(burnt),
        performancePct: pct(performance),
        lockedPct: pct(locked),
      };
    }
  }

  const headlineUsd = {
    ...base.headlineUsd,
    ...live.headlineUsd,
    totalReppoLocked: live.headlineUsd?.totalReppoLocked ?? reppoLocked,
    totalVolumeTraded: live.headlineUsd?.totalVolumeTraded ?? volTraded,
  };

  const datanetV2 = {
    ...base.datanetV2,
    ...live.datanetV2,
  };

  const updated =
    live.updatedAt != null
      ? `Live figures pulled from ${base.sourceUrl} (last updated on ReppoStats: ${live.updatedAt}). Refreshed every few minutes.`
      : `Live figures pulled from ${base.sourceUrl}. Refreshed every few minutes.`;

  return {
    ...base,
    lastUpdatedNote: updated,
    users: {
      ...base.users,
      totalUsersDisplay: totalUsers,
      activitySeries: spark,
      weekOverWeekPct: live.weekOverWeekPct ?? base.users.weekOverWeekPct,
      newThisWeek: live.newUsersThisWeek ?? base.users.newThisWeek,
    },
    headlineUsd,
    sentimentScore: live.sentimentScore ?? base.sentimentScore ?? null,
    locks: {
      ...base.locks,
      totalLocks,
      avgLockPerUser: avgLock,
      communityLockPctOfCirculating: commPct,
      governanceLockPctOfCirculating: govPct,
      lockRateBlurb: blurb,
      communityReppo: live.communityLabel ?? base.locks.communityReppo,
      governanceReppo: live.governanceLabel ?? base.locks.governanceReppo,
      totalLockedReppo: reppoLocked,
      totalLockedUsd: headlineUsd.totalReppoLockedUsd ?? base.locks.totalLockedUsd,
      tvlGovernanceReppo: live.governanceLabel ?? base.locks.tvlGovernanceReppo,
      tvlGovernanceUsd: base.locks.tvlGovernanceUsd,
      tvlUsersReppo: live.communityLabel ?? base.locks.tvlUsersReppo,
      tvlUsersUsd: base.locks.tvlUsersUsd,
    },
    fees,
    datanetV2,
    datanets: live.datanets ?? base.datanets,
  };
}

async function fetchReppoStatsHtml(): Promise<ParsedReppoPartial | null> {
  try {
    const res = await fetch(REPPOSTATS_HOME, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "AltcoinDepot/1.0 (+https://altcoindepot.com; reppo-stats-mirror)",
      },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const html = await res.text();
    return parseReppoStatsHtml(html);
  } catch {
    return null;
  }
}

const getCachedReppoParse = unstable_cache(
  async () => fetchReppoStatsHtml(),
  ["reppo-stats-parse-v2"],
  { revalidate: 300 },
);

export async function getReppoStatsForDisplay(): Promise<ReppoStatsSnapshot> {
  const parsed = await getCachedReppoParse();
  return mergeReppoLiveWithSnapshot(parsed);
}
