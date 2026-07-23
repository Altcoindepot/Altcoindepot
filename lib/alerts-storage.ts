export const ALERTS_STORAGE_KEY = "altcoindepot-price-alerts";
export const ALERTS_CHANGE_EVENT = "alerts-change";

export type PriceAlert = {
  id: string;
  coinId: string;
  name: string;
  symbol: string;
  image?: string;
  /** Fire when price crosses this USD level. */
  targetUsd: number;
  direction: "above" | "below";
  createdAt: string;
  triggeredAt?: string | null;
  enabled: boolean;
};

function safeParse(raw: string | null): PriceAlert[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data
      .filter((item): item is PriceAlert => {
        if (!item || typeof item !== "object") return false;
        const a = item as PriceAlert;
        return (
          typeof a.id === "string" &&
          typeof a.coinId === "string" &&
          typeof a.name === "string" &&
          typeof a.symbol === "string" &&
          typeof a.targetUsd === "number" &&
          (a.direction === "above" || a.direction === "below") &&
          typeof a.enabled === "boolean"
        );
      })
      .slice(0, 50);
  } catch {
    return [];
  }
}

export function readAlerts(): PriceAlert[] {
  if (typeof window === "undefined") return [];
  try {
    return safeParse(localStorage.getItem(ALERTS_STORAGE_KEY));
  } catch {
    return [];
  }
}

export function writeAlerts(alerts: PriceAlert[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts.slice(0, 50)));
    window.dispatchEvent(new CustomEvent(ALERTS_CHANGE_EVENT));
  } catch {
    /* ignore */
  }
}

export function addAlert(
  input: Omit<PriceAlert, "id" | "createdAt" | "triggeredAt" | "enabled">,
): PriceAlert {
  const alert: PriceAlert = {
    ...input,
    id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    triggeredAt: null,
    enabled: true,
  };
  writeAlerts([alert, ...readAlerts()]);
  return alert;
}

export function removeAlert(id: string) {
  writeAlerts(readAlerts().filter((a) => a.id !== id));
}

export function updateAlert(id: string, patch: Partial<PriceAlert>) {
  writeAlerts(readAlerts().map((a) => (a.id === id ? { ...a, ...patch } : a)));
}
