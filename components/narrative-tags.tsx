import {
  narrativeTagClass,
  resolveNarrativeTags,
  type NarrativeTag,
} from "@/lib/coin-narratives";

export function NarrativeTags({
  coinId,
  categories,
  tags,
}: {
  coinId: string;
  categories?: string[] | null;
  tags?: NarrativeTag[];
}) {
  const resolved = tags ?? resolveNarrativeTags({ id: coinId, categories });
  if (resolved.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Narrative tags">
      {resolved.map((tag) => (
        <li key={tag}>
          <span
            className={`inline-flex rounded border bg-black/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${narrativeTagClass(tag)}`}
          >
            {tag}
          </span>
        </li>
      ))}
    </ul>
  );
}
