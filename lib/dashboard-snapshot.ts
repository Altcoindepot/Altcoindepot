import { getMockDashboardSnapshot } from "@/lib/dashboard-mock";
import type { DashboardSnapshot } from "@/lib/dashboard-data";

export type { DashboardSnapshot };

/**
 * Dashboard snapshot — NEVER hits CoinGecko (especially not /coins/markets).
 * Home and any legacy callers get the static mock shell; live UI is Dex-only.
 */
export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  return getMockDashboardSnapshot();
}
