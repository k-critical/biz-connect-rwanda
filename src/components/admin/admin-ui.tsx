import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

export const adminDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Kigali",
});

/** Reads `?page=` safely: anything odd means page 1. */
export function pageParam(value: string | string[] | undefined): number {
  const page = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(page) && page > 0 && page < 10_000 ? page : 1;
}

export function oneOf<T extends string>(
  value: string | string[] | undefined,
  allowed: readonly T[],
  fallback: T,
): T {
  const first = Array.isArray(value) ? value[0] : value;
  return allowed.find((option) => option === first) ?? fallback;
}

/** Tabs that switch a list between statuses, kept in the URL. */
export function StatusTabs<T extends string>({
  basePath,
  current,
  options,
}: {
  basePath: string;
  current: T;
  options: { value: T; label: string }[];
}) {
  return (
    <nav aria-label="Filter by status">
      <ul className="flex flex-wrap gap-2">
        {options.map((option) => (
          <li key={option.value}>
            <Link
              href={`${basePath}?status=${option.value}`}
              aria-current={option.value === current ? "page" : undefined}
              className={cn(
                "inline-flex rounded-full border px-3 py-1.5 text-sm font-semibold",
                option.value === current
                  ? "border-primary bg-primary/10 text-ink"
                  : "border-border-strong text-ink-muted hover:text-ink",
              )}
            >
              {option.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Pager({
  page,
  pageSize,
  total,
  href,
}: {
  page: number;
  pageSize: number;
  total: number;
  href: (page: number) => string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages === 1) return null;
  return (
    <nav aria-label="Pages" className="flex items-center justify-between gap-4 text-sm">
      {page > 1 ? (
        <Link
          href={href(page - 1)}
          className="inline-flex items-center gap-1 font-semibold text-primary"
        >
          <ChevronLeft className="size-4" aria-hidden /> Previous
        </Link>
      ) : (
        <span />
      )}
      <span className="text-ink-muted">
        Page {page} of {pages}
      </span>
      {page < pages ? (
        <Link
          href={href(page + 1)}
          className="inline-flex items-center gap-1 font-semibold text-primary"
        >
          Next <ChevronRight className="size-4" aria-hidden />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

export function EmptyRow({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-border px-6 py-10 text-center text-ink-muted">
      {children}
    </p>
  );
}
