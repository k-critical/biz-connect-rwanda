import Link from "next/link";
import { Check } from "lucide-react";
import type { ChecklistItem } from "@/lib/listing-status";
import { cn } from "@/lib/cn";

const EDIT_PAGE: Record<ChecklistItem["key"], string> = {
  details: "details",
  contact: "contact",
  hours: "hours",
  photos: "photos",
  location: "contact",
  showcase: "showcase",
};

/** What's filled in, with links to finish the rest. */
export function ListingChecklist({
  items,
  hrefBase,
  wizard = false,
}: {
  items: ChecklistItem[];
  /** `/dashboard/<id>` or `/list-your-business/<id>` */
  hrefBase: string;
  wizard?: boolean;
}) {
  return (
    <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface">
      {items.map((item) => {
        // The wizard has no separate photos or showcase step; those live on the dashboard.
        const page = wizard && item.key === "photos" ? "hours" : EDIT_PAGE[item.key];
        const href =
          wizard && item.key === "showcase"
            ? `${hrefBase.replace("/list-your-business/", "/dashboard/")}/showcase`
            : `${hrefBase}/${page}`;
        return (
          <li key={item.key} className="flex items-center gap-3 px-4 py-3">
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full",
                item.done ? "bg-success text-on-success" : "border-2 border-border-strong",
              )}
            >
              {item.done && <Check className="size-4" aria-hidden />}
            </span>
            <span className="flex-1 text-sm">
              <span className="font-semibold text-ink">{item.label}</span>
              <span className="text-ink-muted">
                {item.required ? " · needed" : " · optional"}
                <span className="sr-only">{item.done ? ", done" : ", not done yet"}</span>
              </span>
            </span>
            {!item.done && (
              <Link href={href} className="text-sm font-semibold text-primary hover:underline">
                Add<span className="sr-only"> {item.label.toLowerCase()}</span>
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
