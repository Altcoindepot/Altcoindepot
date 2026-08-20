/** Shared age window between Just Launched and New & Low Caps. */

/** Just Launched: pair age from pairCreatedAt must be ≤ this (0–15 minutes). */
export const JUST_LAUNCHED_MAX_AGE_MS = 15 * 60_000;

/** Clock skew tolerance when a pairCreatedAt is slightly in the future. */
const CLOCK_SKEW_MS = 60_000;

/** True when pair is in the Just Launched window (0–15m). */
export function isJustLaunchedAge(pairCreatedAt: number, now = Date.now()): boolean {
  if (!Number.isFinite(pairCreatedAt)) return false;
  const age = now - pairCreatedAt;
  return age >= -CLOCK_SKEW_MS && age <= JUST_LAUNCHED_MAX_AGE_MS;
}

/**
 * True when pair belongs in New & Low Caps (strictly older than 15m).
 * Unknown createdAt is treated as low-cap eligible (not "just launched").
 */
export function isNewLowCapAge(
  pairCreatedAt: number | null | undefined,
  now = Date.now(),
): boolean {
  if (pairCreatedAt == null || !Number.isFinite(pairCreatedAt)) return true;
  return now - pairCreatedAt > JUST_LAUNCHED_MAX_AGE_MS;
}
