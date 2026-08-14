import { getCoinGeckoLiveSkipReason, logCoinGeckoSkip } from "@/lib/coingecko";
import {
  buildDashboardSnapshot,
  DASHBOARD_REVALIDATE_SECONDS,
  logLiveSnapshot,
  type DashboardSnapshot,
} from "@/lib/dashboard-data";
import { loadLastGood, memoryLastGood, saveLastGood } from "@/lib/dashboard-last-good";
import { getMockDashboardSnapshot } from "@/lib/dashboard-mock";
import { getDexScreenerLowCaps } from "@/lib/dexscreener-low-caps";

function loadedCountOf(snap: DashboardSnapshot): number {
  return snap.narratives.filter((n) => n.sampleSize > 0).length;
}

function asStaleLive(snap: DashboardSnapshot): DashboardSnapshot {
  return {
    ...snap,
    usingMock: false,
    usingStale: true,
    stale: true,
  };
}

/**
 * Overlay DexScreener pairs onto New & Low Caps.
 * Independent of CoinGecko — if this fails, the existing (mock/stale) rows stay.
 */
async function withDexScreenerLowCaps(snap: DashboardSnapshot): Promise<DashboardSnapshot> {
  try {
    const rows = await getDexScreenerLowCaps();
    if (rows.length > 0) {
      return { ...snap, lowCaps: rows };
    }
  } catch (err) {
    console.warn("[dashboard] DexScreener overlay skipped", err);
  }
  return snap;
}

/**
 * Live CoinGecko snapshot with last-good fallback.
 * Successful responses are reused for 1 hour (memory + /tmp on this instance).
 * 429/empty responses are never cached; they reuse last-good or mocks.
 * New & Low Caps always prefer DexScreener (no extra CoinGecko calls).
 */
export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  let base: DashboardSnapshot;
  try {
    base = await loadDashboardSnapshotBase();
  } catch (err) {
    console.error("[dashboard] snapshot base failed; using mock", err);
    base = getMockDashboardSnapshot();
  }
  return withDexScreenerLowCaps(base);
}

async function loadDashboardSnapshotBase(): Promise<DashboardSnapshot> {
  const skip = getCoinGeckoLiveSkipReason();
  if (skip) {
    logCoinGeckoSkip(skip);
    logLiveSnapshot({
      loadedCount: 0,
      usingMock: true,
      usingStale: false,
      lastGood: false,
      reason: skip,
    });
    return getMockDashboardSnapshot();
  }

  const fresh = memoryLastGood();
  if (
    fresh &&
    Date.now() - fresh.at < DASHBOARD_REVALIDATE_SECONDS * 1000 &&
    !fresh.snap.usingMock
  ) {
    logLiveSnapshot({
      loadedCount: loadedCountOf(fresh.snap),
      usingMock: false,
      usingStale: false,
      lastGood: true,
      fromCache: true,
      reason: "success-cache",
    });
    return { ...fresh.snap, usingMock: false, usingStale: false };
  }

  try {
    const snap = await buildDashboardSnapshot();
    await saveLastGood(snap);
    logLiveSnapshot({
      loadedCount: loadedCountOf(snap),
      usingMock: false,
      usingStale: false,
      lastGood: "saved",
      reason: "live",
    });
    return snap;
  } catch (err) {
    const reason = err instanceof Error ? err.message : "fetch-failed";
    const lastGood = (await loadLastGood()) ?? fresh;
    if (lastGood && !lastGood.snap.usingMock) {
      logLiveSnapshot({
        loadedCount: loadedCountOf(lastGood.snap),
        usingMock: false,
        usingStale: true,
        lastGood: true,
        reason,
      });
      console.warn("[dashboard] CoinGecko failed; serving last-good snapshot.", reason);
      return asStaleLive(lastGood.snap);
    }

    logLiveSnapshot({
      loadedCount: 0,
      usingMock: true,
      usingStale: false,
      lastGood: false,
      reason,
    });
    console.error("[dashboard] CoinGecko fetch failed; using mock snapshot.", err);
    return getMockDashboardSnapshot();
  }
}
