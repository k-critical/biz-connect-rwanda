import { Search } from "lucide-react";
import { categories } from "@/config/categories";
import { SORT_OPTIONS, type ExploreFilters } from "@/lib/explore-params";
import { PRICE_LEVELS } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/field";
import { FilterForm } from "./filter-form";

type ProvinceOption = { name: string; districts: { slug: string; name: string }[] };

export function ExploreFilterBar({
  filters,
  action,
  provinces,
  showCategory,
}: {
  filters: ExploreFilters;
  action: string;
  provinces: ProvinceOption[];
  showCategory: boolean;
}) {
  const sortOptions = SORT_OPTIONS.filter((s) => s.value !== "relevance" || filters.q);

  return (
    <FilterForm
      action={action}
      className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 shadow-card"
    >
      <div className="flex gap-2">
        <label htmlFor="explore-q" className="sr-only">
          Search businesses
        </label>
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-ink-subtle"
            aria-hidden
          />
          <input
            id="explore-q"
            name="q"
            type="search"
            defaultValue={filters.q}
            placeholder="Name, dish, service or place"
            className="h-11 w-full rounded-lg border border-border-strong bg-surface pr-3 pl-11 text-base text-ink placeholder:text-ink-subtle"
          />
        </div>
        <Button type="submit">Search</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {showCategory && (
          <SelectField label="Category" name="category" defaultValue={filters.category ?? ""}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </SelectField>
        )}
        <SelectField label="District" name="district" defaultValue={filters.district ?? ""}>
          <option value="">All of Rwanda</option>
          {provinces.map((province) => (
            <optgroup key={province.name} label={province.name}>
              {province.districts.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.name}
                </option>
              ))}
            </optgroup>
          ))}
        </SelectField>
        <SelectField label="Price" name="price" defaultValue={filters.priceLevel?.toString() ?? ""}>
          <option value="">Any price</option>
          {PRICE_LEVELS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </SelectField>
        <SelectField label="Sort by" name="sort" defaultValue={filters.sort}>
          {sortOptions.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </SelectField>
      </div>

      <label className="inline-flex w-fit cursor-pointer items-center gap-2.5 text-sm font-semibold text-ink">
        <input
          type="checkbox"
          name="open"
          value="1"
          defaultChecked={filters.openNow}
          className="size-5 accent-primary"
        />
        Open now
      </label>
    </FilterForm>
  );
}
