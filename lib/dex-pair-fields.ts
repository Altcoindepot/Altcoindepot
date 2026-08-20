/** Shared DexScreener pair field parsing for list rows. */

export function parseDexUsdNumber(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim() !== "") {
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function formatDexPriceUsd(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1000) return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  if (abs >= 1) return `$${n.toFixed(2)}`;
  if (abs >= 0.01) return `$${n.toFixed(4)}`;
  if (abs >= 0.000001) {
    const fixed = n.toFixed(8).replace(/0+$/, "").replace(/\.$/, "");
    return `$${fixed}`;
  }
  return `$${n.toExponential(2)}`;
}

export function formatDexPct(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

export function logDexSampleRow(
  label: string,
  row: {
    symbol?: string;
    priceUsd?: number | null;
    volume?: number | null;
    liquidity?: number | null;
  } | null | undefined,
) {
  if (!row) {
    console.info(`[${label}] sample row: none`);
    return;
  }
  console.info(`[${label}] sample row`, {
    symbol: row.symbol ?? null,
    priceUsd: row.priceUsd ?? null,
    volume24h: row.volume ?? null,
    liquidity: row.liquidity ?? null,
  });
}
