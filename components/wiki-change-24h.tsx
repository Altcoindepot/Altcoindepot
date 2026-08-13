export function formatChange24h(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

export function change24hClass(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "text-zinc-600";
  return n >= 0 ? "text-emerald-300" : "text-red-300";
}

export function WikiChange24h({
  value,
  className = "",
}: {
  value: number | null | undefined;
  className?: string;
}) {
  return (
    <span className={`font-mono tabular-nums ${change24hClass(value)} ${className}`.trim()}>
      {formatChange24h(value)}
    </span>
  );
}
