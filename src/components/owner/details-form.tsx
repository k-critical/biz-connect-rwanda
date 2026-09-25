"use client";

import { useState } from "react";
import { categories } from "@/config/categories";
import { PRICE_LEVELS } from "@/lib/format";
import { LISTING_LIMITS } from "@/lib/listing-rules";
import { saveDetailsAction, startListingAction } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { FormMessage } from "./form-message";
import { useFormAction } from "./use-form-action";

export type DistrictGroup = { name: string; districts: { slug: string; name: string }[] };

export type DetailsDefaults = {
  name: string;
  tagline: string;
  description: string;
  category: string;
  extraCategories: string[];
  district: string;
  priceLevel: number | null;
};

const EMPTY: DetailsDefaults = {
  name: "",
  tagline: "",
  description: "",
  category: "",
  extraCategories: [],
  district: "",
  priceLevel: null,
};

/**
 * The basics: name, categories, district, description and price level.
 * `create` starts a new draft; `wizard` and `edit` update an existing listing.
 */
export function DetailsForm({
  mode,
  businessId,
  defaults = EMPTY,
  districts,
}: {
  mode: "create" | "wizard" | "edit";
  businessId?: string;
  defaults?: DetailsDefaults;
  districts: DistrictGroup[];
}) {
  const { state, pending, onSubmit, formRef, errorFor } = useFormAction(
    mode === "create" ? startListingAction : saveDetailsAction,
  );
  const [category, setCategory] = useState(defaults.category);
  const [extras, setExtras] = useState<string[]>(defaults.extraCategories);
  const [description, setDescription] = useState(defaults.description);

  const toggleExtra = (slug: string, checked: boolean) =>
    setExtras((current) =>
      checked ? [...current, slug] : current.filter((value) => value !== slug),
    );
  const extraChoices = categories.filter((c) => c.slug !== category);
  const extrasFull =
    extras.filter((slug) => slug !== category).length >= LISTING_LIMITS.extraCategories;

  return (
    <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-6">
      <FormMessage state={state} />
      {businessId && <input type="hidden" name="businessId" value={businessId} />}
      <input type="hidden" name="mode" value={mode} />

      <TextField
        label="Business name"
        name="name"
        required
        maxLength={LISTING_LIMITS.name}
        defaultValue={defaults.name}
        autoComplete="organization"
        hint="The name customers know you by, as it's written on your sign."
        error={errorFor("name")}
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <SelectField
          label="Main category"
          name="category"
          required
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          error={errorFor("category")}
        >
          <option value="" disabled>
            Choose one…
          </option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="District"
          name="district"
          required
          defaultValue={defaults.district}
          error={errorFor("district")}
        >
          <option value="" disabled>
            Choose a district…
          </option>
          {districts.map((province) => (
            <optgroup key={province.name} label={province.name}>
              {province.districts.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.name}
                </option>
              ))}
            </optgroup>
          ))}
        </SelectField>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-semibold text-ink">Also fits under (optional)</legend>
        <p className="text-sm text-ink-muted">
          Pick up to {LISTING_LIMITS.extraCategories} more, e.g. a hotel with a restaurant.
        </p>
        <div className="mt-1 flex flex-wrap gap-2">
          {extraChoices.map((c) => {
            const checked = extras.includes(c.slug);
            return (
              <label
                key={c.slug}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm",
                  "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary",
                  checked
                    ? "border-primary bg-primary/10 font-semibold text-ink"
                    : "border-border-strong text-ink-muted",
                  !checked && extrasFull && "cursor-not-allowed opacity-50",
                )}
              >
                <input
                  type="checkbox"
                  name="extraCategories"
                  value={c.slug}
                  checked={checked}
                  disabled={!checked && extrasFull}
                  onChange={(event) => toggleExtra(c.slug, event.target.checked)}
                  className="size-4 accent-primary"
                />
                {c.name}
              </label>
            );
          })}
        </div>
      </fieldset>

      <TextField
        label="Short description"
        name="tagline"
        required
        maxLength={LISTING_LIMITS.tagline}
        defaultValue={defaults.tagline}
        hint="One line shown on your card, e.g. “Brochettes and fresh juice near Kimironko market”."
        error={errorFor("tagline")}
      />

      <div className="flex flex-col gap-1">
        <TextAreaField
          label="About the business"
          name="description"
          required
          rows={6}
          minLength={LISTING_LIMITS.descriptionMin}
          maxLength={LISTING_LIMITS.description}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          hint="What you offer, what makes you different, and anything a first-time customer should know."
          error={errorFor("description")}
        />
        <p className="self-end text-xs text-ink-subtle" aria-live="polite">
          {description.length} / {LISTING_LIMITS.description}
        </p>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-semibold text-ink">Prices</legend>
        <div className="flex flex-wrap gap-2">
          {[{ value: "", label: "Not listed" }, ...PRICE_LEVELS].map((level) => (
            <label
              key={level.value}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border-strong px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:font-semibold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary"
            >
              <input
                type="radio"
                name="priceLevel"
                value={level.value}
                defaultChecked={String(defaults.priceLevel ?? "") === String(level.value)}
                className="size-4 accent-primary"
              />
              {level.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-3 border-t border-border pt-6">
        <Button type="submit" size="lg" loading={pending}>
          {mode === "edit" ? "Save changes" : "Save and continue"}
        </Button>
      </div>
    </form>
  );
}
