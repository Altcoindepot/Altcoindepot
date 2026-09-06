import { PROJECT_UPDATES, type ProjectUpdate } from "@/lib/project-updates";

/**
 * Project feed — static updates only.
 * Formerly used loadMarketsBundle → /coins/markets (quota leak).
 */
export async function getFeaturedCoinFeed(): Promise<ProjectUpdate[]> {
  return PROJECT_UPDATES;
}
