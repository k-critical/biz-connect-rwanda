"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { segment: "", label: "Overview" },
  { segment: "details", label: "The basics" },
  { segment: "contact", label: "Contact and location" },
  { segment: "hours", label: "Hours" },
  { segment: "photos", label: "Photos" },
  { segment: "showcase", label: "Menu and products" },
  { segment: "preview", label: "Preview" },
] as const;

/** Sections of one listing in the owner dashboard. Scrolls sideways on small phones. */
export function ListingTabs({ businessId, locked }: { businessId: string; locked: boolean }) {
  const pathname = usePathname();
  const base = `/dashboard/${businessId}`;
  const tabs = locked ? TABS.filter((t) => t.segment === "" || t.segment === "preview") : TABS;

  return (
    <nav aria-label="Listing sections" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-1 border-b border-border">
        {tabs.map((tab) => {
          const href = tab.segment ? `${base}/${tab.segment}` : base;
          const active = pathname === href;
          return (
            <li key={tab.segment}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className="-mb-px block border-b-2 border-transparent px-3 py-3 text-sm font-semibold whitespace-nowrap text-ink-muted hover:text-ink aria-[current=page]:border-primary aria-[current=page]:text-primary"
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
