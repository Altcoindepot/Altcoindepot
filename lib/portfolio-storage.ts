export const PORTFOLIO_STORAGE_KEY = "altcoindepot-portfolio";
export const PORTFOLIO_CHANGE_EVENT = "portfolio-change";

export type PortfolioHolding = {
  id: string;
  coinId: string;
  name: string;
  symbol: string;
  image?: string;
  amount: number;
  costBasisUsd?: number | null;
  addedAt: string;
};

function safeParse(raw: string | null): PortfolioHolding[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data
      .filter((item): item is PortfolioHolding => {
        if (!item || typeof item !== "object") return false;
        const h = item as PortfolioHolding;
        return (
          typeof h.id === "string" &&
          typeof h.coinId === "string" &&
          typeof h.name === "string" &&
          typeof h.symbol === "string" &&
          typeof h.amount === "number" &&
          Number.isFinite(h.amount)
        );
      })
      .slice(0, 100);
  } catch {
    return [];
  }
}

export function readPortfolio(): PortfolioHolding[] {
  if (typeof window === "undefined") return [];
  try {
    return safeParse(localStorage.getItem(PORTFOLIO_STORAGE_KEY));
  } catch {
    return [];
  }
}

export function writePortfolio(holdings: PortfolioHolding[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(holdings.slice(0, 100)));
    window.dispatchEvent(new CustomEvent(PORTFOLIO_CHANGE_EVENT));
  } catch {
    /* ignore */
  }
}

export function upsertHolding(input: {
  coinId: string;
  name: string;
  symbol: string;
  image?: string;
  amount: number;
  costBasisUsd?: number | null;
}) {
  const current = readPortfolio();
  const existing = current.find((h) => h.coinId === input.coinId);
  if (existing) {
    writePortfolio(
      current.map((h) =>
        h.coinId === input.coinId
          ? {
              ...h,
              amount: input.amount,
              costBasisUsd: input.costBasisUsd ?? h.costBasisUsd,
              name: input.name,
              symbol: input.symbol,
              image: input.image ?? h.image,
            }
          : h,
      ),
    );
    return;
  }
  writePortfolio([
    {
      id: `hold-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      coinId: input.coinId,
      name: input.name,
      symbol: input.symbol,
      image: input.image,
      amount: input.amount,
      costBasisUsd: input.costBasisUsd ?? null,
      addedAt: new Date().toISOString(),
    },
    ...current,
  ]);
}

export function removeHolding(id: string) {
  writePortfolio(readPortfolio().filter((h) => h.id !== id));
}
