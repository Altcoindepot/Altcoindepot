import {
  narrativeTagClass,
  resolveNarrativeTags,
  type CoinCategoryLabel,
} from "@/lib/coin-narratives";
import { ds } from "@/lib/ui-classes";

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
    <ul className="flex min-h-6 flex-wrap gap-1.5" aria-label="CoinGecko categories">
      {resolved.map((tag) => (
        <li key={tag}>
          <span className={`${ds.badge} ${narrativeTagClass(tag)}`}>{tag}</span>
        </li>
      ))}
    </ul>
  );
}
