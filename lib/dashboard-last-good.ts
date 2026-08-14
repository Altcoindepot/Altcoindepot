import { tmpdir } from "node:os";
import { join } from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import type { DashboardSnapshot } from "@/lib/dashboard-data";

const FILE = join(tmpdir(), "altcoindepot-dashboard-last-good.json");

type Stored = { at: number; snap: DashboardSnapshot };

const g = globalThis as typeof globalThis & {
  __acdDashboardLastGood?: Stored | null;
};

function isUsableLiveSnapshot(snap: DashboardSnapshot | undefined | null): snap is DashboardSnapshot {
  if (!snap || snap.usingMock) return false;
  if (!Array.isArray(snap.narratives) || snap.narratives.length === 0) return false;
  if (Array.isArray(snap.lowCaps) && snap.lowCaps.some((row) => row.id.startsWith("mock-"))) {
    return false;
  }
  return true;
}

export function memoryLastGood(): Stored | null {
  const stored = g.__acdDashboardLastGood ?? null;
  if (stored && isUsableLiveSnapshot(stored.snap)) return stored;
  return null;
}

export async function saveLastGood(snap: DashboardSnapshot): Promise<void> {
  if (!isUsableLiveSnapshot(snap)) return;
  const stored: Stored = { at: Date.now(), snap: { ...snap, usingMock: false } };
  g.__acdDashboardLastGood = stored;
  try {
    await writeFile(FILE, JSON.stringify(stored), "utf8");
  } catch (err) {
    console.warn("[dashboard] last-good disk write failed", err);
  }
}

export async function loadLastGood(): Promise<Stored | null> {
  const mem = memoryLastGood();
  if (mem) return mem;
  try {
    const raw = await readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as Stored;
    if (typeof parsed.at === "number" && isUsableLiveSnapshot(parsed.snap)) {
      g.__acdDashboardLastGood = parsed;
      return parsed;
    }
  } catch {
    /* no last-good file on this instance yet */
  }
  return null;
}
