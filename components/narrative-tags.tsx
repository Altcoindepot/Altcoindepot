import {
  narrativeTagClass,
  resolveNarrativeTags,
  type CoinCategoryLabel,
} from "@/lib/coin-narratives";

export function NarrativeTags({
  coinId,
  categories,
  tags,
  max = 2,
}: {
  coinId: string;
  categories?: string[] | null;
  tags?: CoinCategoryLabel[];
  /** Keep card heights stable on dense grids. */
  max?: number;
}) {
  const resolved = (tags ?? resolveNarrativeTags({ id: coinId, categories })).slice(0, max);
  if (resolved.length === 0) return null;

  return (
    <ul className="flex min-h-[1.25rem] flex-wrap gap-1" aria-label="CoinGecko categories">
      {resolved.map((tag) => (
        <li key={tag}>
          <span
            className={`inline-flex rounded border bg-black/20 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide ${narrativeTagClass(tag)}`}
          >
            {tag}
          </span>
        </li>
      ))}
    </ul>
  );
}
