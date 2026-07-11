"use client";

import { CategoryTickerColumn } from "@/components/category-ticker-column";
import { useMarkets } from "@/components/markets-provider";

export function HomeCategoryColumns() {
  const { categoryHomeColumns } = useMarkets();

  return (
    <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {categoryHomeColumns.map((col) => (
        <CategoryTickerColumn
          key={col.slug}
          title={col.title}
          titleHref={`/category/${encodeURIComponent(col.slug)}`}
          description={col.description}
          coins={col.coins}
          accentClass={col.accentClass}
        />
      ))}
    </div>
  );
}
