"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/listings", label: "Listings" },
  { href: "/admin/claims", label: "Claims" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/audit", label: "Audit log" },
] as const;

export function AdminNav({ counts }: { counts: Partial<Record<string, number>> }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-1 border-b border-border">
        {LINKS.map((link) => {
          const active =
            link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
          const count = counts[link.href];
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className="-mb-px flex items-center gap-2 border-b-2 border-transparent px-3 py-3 text-sm font-semibold whitespace-nowrap text-ink-muted hover:text-ink aria-[current=page]:border-primary aria-[current=page]:text-primary"
              >
                {link.label}
                {count ? (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-on-accent">
                    {count}
                    <span className="sr-only"> waiting</span>
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
