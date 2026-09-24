import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { exploreHref, type ExploreFilters } from "@/lib/explore-params";
import { buttonStyles } from "@/components/ui/button";
import { cn } from "@/lib/cn";

/** Page numbers to show: first, last, and the current page's neighbours, with gaps as null. */
export function visiblePages(page: number, pageCount: number): (number | null)[] {
  const wanted = new Set([1, pageCount, page - 1, page, page + 1]);
  const pages = [...wanted].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
  return pages.flatMap((p, i) => (i > 0 && p - pages[i - 1] > 1 ? [null, p] : [p]));
}

export function Pagination({
  filters,
  pageCount,
  hrefOptions,
}: {
  filters: ExploreFilters;
  pageCount: number;
  hrefOptions: { basePath?: string; omitCategory?: boolean };
}) {
  if (pageCount <= 1) return null;
  const page = Math.min(filters.page, pageCount);
  const href = (p: number) => exploreHref(filters, { page: p }, hrefOptions);
  const edge = (label: "Previous" | "Next", target: number, enabled: boolean) => {
    const content =
      label === "Previous" ? (
        <>
          <ChevronLeft aria-hidden /> Previous
        </>
      ) : (
        <>
          Next <ChevronRight aria-hidden />
        </>
      );
    return enabled ? (
      <Link href={href(target)} className={buttonStyles({ variant: "secondary", size: "sm" })}>
        {content}
      </Link>
    ) : (
      <span
        aria-disabled="true"
        className={buttonStyles({ variant: "secondary", size: "sm", className: "opacity-40" })}
      >
        {content}
      </span>
    );
  };

  return (
    <nav aria-label="Pages" className="flex flex-wrap items-center justify-center gap-2">
      {edge("Previous", page - 1, page > 1)}
      <ol className="flex items-center gap-1">
        {visiblePages(page, pageCount).map((p, i) =>
          p === null ? (
            <li key={`gap-${i}`} aria-hidden className="px-1 text-ink-subtle">
              …
            </li>
          ) : (
            <li key={p}>
              <Link
                href={href(p)}
                aria-current={p === page ? "page" : undefined}
                aria-label={`Page ${p}`}
                className={cn(
                  "flex size-9 items-center justify-center rounded-lg text-sm font-semibold",
                  p === page ? "bg-primary text-on-primary" : "text-ink hover:bg-surface-2",
                )}
              >
                {p}
              </Link>
            </li>
          ),
        )}
      </ol>
      {edge("Next", page + 1, page < pageCount)}
    </nav>
  );
}
