"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ListPlus, Plus, Trash2 } from "lucide-react";
import { LISTING_LIMITS } from "@/lib/listing-rules";
import { saveShowcaseAction } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormMessage } from "./form-message";
import { useFormAction } from "./use-form-action";

export type ShowcaseDefaults = {
  title: string;
  items: { name: string; description: string | null; priceRwf: number | null }[];
}[];

type Item = { key: number; name: string; description: string; price: string };
type Section = { key: number; title: string; items: Item[] };

const input =
  "h-10 w-full min-w-0 rounded-lg border border-border-strong bg-surface px-3 text-sm text-ink placeholder:text-ink-subtle";

function move<T>(list: T[], index: number, by: -1 | 1): T[] {
  const target = index + by;
  if (target < 0 || target >= list.length) return list;
  const copy = [...list];
  [copy[index], copy[target]] = [copy[target]!, copy[index]!];
  return copy;
}

// React list keys for rows added in the browser; they only need to be unique.
let lastKey = 0;
const key = () => ++lastKey;

function serialize(sections: Section[]) {
  return sections.map((section) => ({
    title: section.title,
    items: section.items.map((item) => {
      const digits = item.price.replace(/[\s,.]/g, "");
      return {
        name: item.name,
        description: item.description,
        priceRwf: digits === "" ? null : /^\d+$/.test(digits) ? Number(digits) : -1,
      };
    }),
  }));
}

/** Menu, products, rooms or services, grouped into sections, with optional prices in RWF. */
export function ShowcaseForm({
  businessId,
  defaults,
  examples,
}: {
  businessId: string;
  defaults: ShowcaseDefaults;
  /** Section title suggestions for this kind of business, e.g. "Rooms". */
  examples: string;
}) {
  const { state, pending, onSubmit, formRef } = useFormAction(saveShowcaseAction);
  const newItem = (): Item => ({ key: key(), name: "", description: "", price: "" });

  const [sections, setSections] = useState<Section[]>(() =>
    defaults.map((section) => ({
      key: key(),
      title: section.title,
      items: section.items.map((item) => ({
        key: key(),
        name: item.name,
        description: item.description ?? "",
        price: item.priceRwf === null ? "" : String(item.priceRwf),
      })),
    })),
  );

  const updateSection = (index: number, change: (section: Section) => Section) =>
    setSections((current) => current.map((s, i) => (i === index ? change(s) : s)));

  const updateItem = (sectionIndex: number, itemIndex: number, field: keyof Item, value: string) =>
    updateSection(sectionIndex, (section) => ({
      ...section,
      items: section.items.map((item, i) => (i === itemIndex ? { ...item, [field]: value } : item)),
    }));

  return (
    <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-6">
      <FormMessage state={state} />
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="showcase" value={JSON.stringify(serialize(sections))} />

      {sections.length === 0 && (
        <EmptyState
          icon={ListPlus}
          headingLevel={3}
          title="Nothing listed yet"
          description={`Group what you offer into sections, such as ${examples}. Prices are optional.`}
        />
      )}

      {sections.map((section, sectionIndex) => (
        <fieldset
          key={section.key}
          className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 shadow-card sm:p-5"
        >
          <legend className="sr-only">Section {sectionIndex + 1}</legend>
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex min-w-48 flex-1 flex-col gap-1.5">
              <span className="text-sm font-semibold">Section title</span>
              <input
                value={section.title}
                required
                maxLength={60}
                placeholder={examples.split(",")[0]?.replace(/[“”"]/g, "").trim()}
                onChange={(e) =>
                  updateSection(sectionIndex, (s) => ({ ...s, title: e.target.value }))
                }
                className={`${input} h-11 text-base font-semibold`}
              />
            </label>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Move section ${sectionIndex + 1} up`}
                disabled={sectionIndex === 0}
                onClick={() => setSections((s) => move(s, sectionIndex, -1))}
              >
                <ArrowUp aria-hidden />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Move section ${sectionIndex + 1} down`}
                disabled={sectionIndex === sections.length - 1}
                onClick={() => setSections((s) => move(s, sectionIndex, 1))}
              >
                <ArrowDown aria-hidden />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-danger"
                onClick={() => {
                  if (
                    section.items.every((item) => !item.name) ||
                    window.confirm(
                      `Remove the “${section.title || "untitled"}” section and its items?`,
                    )
                  ) {
                    setSections((s) => s.filter((_, i) => i !== sectionIndex));
                  }
                }}
              >
                <Trash2 aria-hidden /> Remove section
              </Button>
            </div>
          </div>

          <ol className="flex flex-col gap-3">
            {section.items.map((item, itemIndex) => (
              <li
                key={item.key}
                className="grid gap-2 rounded-lg bg-surface-2 p-3 sm:grid-cols-[1fr_9rem_auto] sm:items-start"
              >
                <div className="flex flex-col gap-2">
                  <input
                    value={item.name}
                    required
                    maxLength={80}
                    aria-label={`Item ${itemIndex + 1} name`}
                    placeholder="Name, e.g. Goat brochette"
                    onChange={(e) => updateItem(sectionIndex, itemIndex, "name", e.target.value)}
                    className={input}
                  />
                  <input
                    value={item.description}
                    maxLength={200}
                    aria-label={`Item ${itemIndex + 1} description (optional)`}
                    placeholder="Short description (optional)"
                    onChange={(e) =>
                      updateItem(sectionIndex, itemIndex, "description", e.target.value)
                    }
                    className={input}
                  />
                </div>
                <label className="flex items-center gap-2">
                  <input
                    value={item.price}
                    inputMode="numeric"
                    aria-label={`Item ${itemIndex + 1} price in Rwandan francs (optional)`}
                    placeholder="Price"
                    pattern="[0-9 ,.]*"
                    onChange={(e) => updateItem(sectionIndex, itemIndex, "price", e.target.value)}
                    className={input}
                  />
                  <span className="text-xs font-semibold text-ink-muted">RWF</span>
                </label>
                <div className="flex gap-1 sm:flex-col">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Move item ${itemIndex + 1} up`}
                    disabled={itemIndex === 0}
                    onClick={() =>
                      updateSection(sectionIndex, (s) => ({
                        ...s,
                        items: move(s.items, itemIndex, -1),
                      }))
                    }
                  >
                    <ArrowUp aria-hidden />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Remove item ${itemIndex + 1}`}
                    onClick={() =>
                      updateSection(sectionIndex, (s) => ({
                        ...s,
                        items: s.items.filter((_, i) => i !== itemIndex),
                      }))
                    }
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              </li>
            ))}
          </ol>

          {section.items.length < LISTING_LIMITS.showcaseItemsPerSection && (
            <Button
              variant="secondary"
              size="sm"
              className="self-start"
              onClick={() =>
                updateSection(sectionIndex, (s) => ({ ...s, items: [...s.items, newItem()] }))
              }
            >
              <Plus aria-hidden /> Add an item
            </Button>
          )}
        </fieldset>
      ))}

      <div className="flex flex-wrap gap-3 border-t border-border pt-6">
        {sections.length < LISTING_LIMITS.showcaseSections && (
          <Button
            variant="secondary"
            size="lg"
            onClick={() =>
              setSections((s) => [...s, { key: key(), title: "", items: [newItem()] }])
            }
          >
            <Plus aria-hidden /> Add a section
          </Button>
        )}
        <Button type="submit" size="lg" loading={pending}>
          Save
        </Button>
      </div>
    </form>
  );
}
