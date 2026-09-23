import { z } from "zod";
import { categories, type CategorySlug } from "@/config/categories";

export const SORT_OPTIONS = [
  { value: "relevance", label: "Best match" },
  { value: "recommended", label: "Recommended" },
  { value: "name", label: "Name A–Z" },
  { value: "newest", label: "Newest" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];
export type PriceLevel = 1 | 2 | 3;

export type ExploreFilters = {
  q?: string;
  category?: CategorySlug;
  district?: string;
  priceLevel?: PriceLevel;
  openNow: boolean;
  sort: SortOption;
  page: number;
};

export type RawSearchParams = Record<string, string | string[] | undefined>;

const categorySlugs = categories.map((c) => c.slug) as [CategorySlug, ...CategorySlug[]];

// Anything invalid in the URL is ignored rather than shown as an error page.
const paramsSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  category: z.enum(categorySlugs).optional().catch(undefined),
  district: z
    .string()
    .regex(/^[a-z]+(-[a-z]+)*$/)
    .optional()
    .catch(undefined),
  price: z.enum(["1", "2", "3"]).optional().catch(undefined),
  open: z.literal("1").optional().catch(undefined),
  sort: z
    .enum(SORT_OPTIONS.map((s) => s.value))
    .optional()
    .catch(undefined),
  page: z.coerce.number().int().min(1).max(500).optional().catch(undefined),
});

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export function defaultSort(q?: string): SortOption {
  return q ? "relevance" : "recommended";
}

export function parseExploreParams(raw: RawSearchParams): ExploreFilters {
  const parsed = paramsSchema.parse(
    Object.fromEntries(Object.keys(paramsSchema.shape).map((key) => [key, first(raw[key])])),
  );
  const q = parsed.q || undefined;
  const sort = parsed.sort === "relevance" && !q ? "recommended" : (parsed.sort ?? defaultSort(q));
  return {
    q,
    category: parsed.category,
    district: parsed.district,
    priceLevel: parsed.price ? (Number(parsed.price) as PriceLevel) : undefined,
    openNow: parsed.open === "1",
    sort,
    page: parsed.page ?? 1,
  };
}

/** The query string exactly as it arrived, for comparing with the canonical URL. */
export function rawQueryString(raw: RawSearchParams): string {
  return new URLSearchParams(
    Object.entries(raw).flatMap(([key, value]) =>
      value === undefined ? [] : (Array.isArray(value) ? value : [value]).map((v) => [key, v]),
    ),
  ).toString();
}

/**
 * Builds a clean URL for a filter state. Defaults are left out, and the page resets to 1
 * whenever a filter changes unless the change sets the page itself.
 */
export function exploreHref(
  filters: ExploreFilters,
  changes: Partial<ExploreFilters> = {},
  options: { basePath?: string; omitCategory?: boolean } = {},
): string {
  const next = { ...filters, page: 1, ...changes };
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.category && !options.omitCategory) params.set("category", next.category);
  if (next.district) params.set("district", next.district);
  if (next.priceLevel) params.set("price", String(next.priceLevel));
  if (next.openNow) params.set("open", "1");
  if (next.sort !== defaultSort(next.q)) params.set("sort", next.sort);
  if (next.page > 1) params.set("page", String(next.page));
  const query = params.toString();
  const basePath = options.basePath ?? "/explore";
  return query ? `${basePath}?${query}` : basePath;
}
