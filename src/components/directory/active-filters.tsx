import Link from "next/link";
import { X } from "lucide-react";
import { getCategory } from "@/config/categories";
import { exploreHref, type ExploreFilters } from "@/lib/explore-params";
import { priceLevelLabel } from "@/lib/format";

export function ActiveFilters({
  filters,
  districtName,
  hrefOptions,
  showCategory,
}: {
  filters: ExploreFilters;
  districtName?: string;
  hrefOptions: { basePath?: string; omitCategory?: boolean };
  showCategory: boolean;
}) {
  const pills: { label: string; remove: Partial<ExploreFilters> }[] = [];
  if (filters.q)
    pills.push({ label: `“${filters.q}”`, remove: { q: undefined, sort: "recommended" } });
  if (showCategory && filters.category) {
    pills.push({ label: getCategory(filters.category).name, remove: { category: undefined } });
  }
  if (filters.district) {
    pills.push({ label: districtName ?? filters.district, remove: { district: undefined } });
  }
  if (filters.priceLevel) {
    pills.push({ label: priceLevelLabel(filters.priceLevel)!, remove: { priceLevel: undefined } });
  }
  if (filters.openNow) pills.push({ label: "Open now", remove: { openNow: false } });

  if (pills.length === 0) return null;

  const clearAll: Partial<ExploreFilters> = {
    q: undefined,
    category: showCategory ? undefined : filters.category,
    district: undefined,
    priceLevel: undefined,
    openNow: false,
    sort: "recommended",
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-ink-muted">Filtered by:</span>
      {pills.map((pill) => (
        <Link
          key={pill.label}
          href={exploreHref(filters, pill.remove, hrefOptions)}
          className="inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-surface py-1 pr-2 pl-3 text-sm font-semibold text-ink hover:bg-surface-2"
        >
          {pill.label}
          <X className="size-3.5" aria-hidden />
          <span className="sr-only">(remove filter)</span>
        </Link>
      ))}
      {pills.length > 1 && (
        <Link
          href={exploreHref(filters, clearAll, hrefOptions)}
          className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          Clear all
        </Link>
      )}
    </div>
  );
}
