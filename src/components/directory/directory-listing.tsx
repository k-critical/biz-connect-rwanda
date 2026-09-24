import { SearchX } from "lucide-react";
import { exploreHref, type ExploreFilters } from "@/lib/explore-params";
import { getDistrictOptions, searchDirectory } from "@/server/services/directory-service";
import { BusinessGrid } from "@/components/business/business-grid";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ActiveFilters } from "./active-filters";
import { ExploreFilterBar } from "./explore-filters";
import { Pagination } from "./pagination";

export async function DirectoryListing({
  filters,
  basePath,
  lockedCategory = false,
}: {
  filters: ExploreFilters;
  basePath: string;
  lockedCategory?: boolean;
}) {
  const [results, provinces] = await Promise.all([searchDirectory(filters), getDistrictOptions()]);
  const hrefOptions = { basePath, omitCategory: lockedCategory };
  const districtName = provinces
    .flatMap((p) => p.districts)
    .find((d) => d.slug === filters.district)?.name;
  const countLabel = `${results.total} ${results.total === 1 ? "business" : "businesses"}`;

  return (
    <div className="flex flex-col gap-6">
      <ExploreFilterBar
        // Remount when the URL changes so the fields always show the current filters,
        // including after the back button or a "remove filter" link.
        key={exploreHref(filters, { page: 1 }, hrefOptions)}
        filters={filters}
        action={basePath}
        provinces={provinces}
        showCategory={!lockedCategory}
      />
      <div className="flex flex-col gap-3">
        <p className="text-sm text-ink-muted" aria-live="polite">
          <strong className="font-semibold text-ink">{countLabel}</strong>
          {filters.q ? ` matching “${filters.q}”` : ""}
        </p>
        <ActiveFilters
          filters={filters}
          districtName={districtName}
          hrefOptions={hrefOptions}
          showCategory={!lockedCategory}
        />
      </div>

      {results.items.length > 0 ? (
        <>
          <BusinessGrid businesses={results.items} />
          <Pagination filters={filters} pageCount={results.pageCount} hrefOptions={hrefOptions} />
        </>
      ) : (
        <EmptyState
          icon={SearchX}
          title={
            results.total > 0 ? "There's nothing on this page" : "No businesses match your search"
          }
          description="Try a different word, choose another district, or clear the filters to see everything."
          action={
            <ButtonLink
              variant="secondary"
              href={exploreHref(
                filters,
                {
                  q: undefined,
                  district: undefined,
                  priceLevel: undefined,
                  openNow: false,
                  sort: "recommended",
                  category: lockedCategory ? filters.category : undefined,
                },
                hrefOptions,
              )}
            >
              Clear filters
            </ButtonLink>
          }
        />
      )}
    </div>
  );
}
