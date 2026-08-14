import { isProductionBuild } from "@/lib/build-phase";
import {
  buildDashboardSnapshot,
  DASHBOARD_REVALIDATE_SECONDS,
  logLiveSnapshot,
  type DashboardSnapshot,
} from "@/lib/dashboard-data";
import { loadLastGood, memoryLastGood, saveLastGood } from "@/lib/dashboard-last-good";
import { getMockDashboardSnapshot } from "@/lib/dashboard-mock";

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
 * Live CoinGecko snapshot with last-good fallback.
 * Successful responses are reused for 1 hour (memory + /tmp on this instance).
 * 429/empty responses are never cached; they reuse last-good or mocks.
 */
export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  if (isProductionBuild()) {
    logLiveSnapshot({
      loadedCount: 0,
      usingMock: true,
      usingStale: false,
      lastGood: false,
      reason: "build-phase",
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
