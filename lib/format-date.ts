/** Avoid RangeError from `Intl.DateTimeFormat#format` when RSS dates are malformed. */
export function formatShortMonthDay(iso: string | undefined | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d);
  } catch {
    return "—";
  }
}

/** US Eastern (EST/EDT) for news timestamps — same `Intl` options on server and client. */
export function formatNewsTimestampEst(iso: string | undefined | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZoneName: "short",
    }).format(d);
  } catch {
    return "—";
  }
}
