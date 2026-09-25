import type { Metadata } from "next";
import Link from "next/link";
import { Flag, Search, Star } from "lucide-react";
import { LISTING_STATUS, type ListingStatus } from "@/lib/listing-status";
import { requireRole } from "@/server/auth/session";
import { ADMIN_PAGE_SIZE, getListingQueue } from "@/server/services/admin-service";
import {
  EmptyRow,
  Pager,
  StatusTabs,
  adminDate,
  oneOf,
  pageParam,
} from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Listings" };

const STATUSES: ListingStatus[] = ["PENDING", "REJECTED", "APPROVED", "SUSPENDED", "DRAFT"];

export default async function AdminListingsPage({ searchParams }: PageProps<"/admin/listings">) {
  await requireRole("ADMIN", "/admin/listings");
  const params = await searchParams;
  const status = oneOf(params.status, STATUSES, "PENDING");
  const page = pageParam(params.page);
  const q = (Array.isArray(params.q) ? params.q[0] : params.q)?.trim().slice(0, 100) || undefined;
  const { items, total } = await getListingQueue(status, page, q);

  const href = (p: number) =>
    `/admin/listings?status=${status}${q ? `&q=${encodeURIComponent(q)}` : ""}&page=${p}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-bold">Listings</h1>
        <form action="/admin/listings" className="flex gap-2" role="search">
          <input type="hidden" name="status" value={status} />
          <label className="sr-only" htmlFor="admin-listing-search">
            Search by name or owner email
          </label>
          <input
            id="admin-listing-search"
            name="q"
            defaultValue={q}
            placeholder="Name or owner email"
            className="h-10 w-56 rounded-lg border border-border-strong bg-surface px-3 text-sm"
          />
          <button
            type="submit"
            className="flex size-10 items-center justify-center rounded-lg border border-border-strong hover:bg-surface-2"
          >
            <Search className="size-4" aria-hidden />
            <span className="sr-only">Search</span>
          </button>
        </form>
      </div>

      <StatusTabs
        basePath="/admin/listings"
        current={status}
        options={STATUSES.map((value) => ({ value, label: LISTING_STATUS[value].label }))}
      />

      <p className="text-sm text-ink-muted">
        {total} {total === 1 ? "listing" : "listings"}
        {status === "PENDING" && total > 0 && ", oldest first"}
        {q && ` matching “${q}”`}
      </p>

      {items.length === 0 ? (
        <EmptyRow>
          {status === "PENDING" ? "Nothing waiting for review. Well done." : "No listings here."}
        </EmptyRow>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
          {items.map((b) => (
            <li
              key={b.id}
              className="relative flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-4 hover:bg-surface-2/50"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Link
                  href={`/admin/listings/${b.id}`}
                  className="font-semibold after:absolute after:inset-0 hover:text-primary"
                >
                  {b.name}
                </Link>
                <p className="text-sm text-ink-muted">
                  {b.district.name} · {b.owner ? `${b.owner.name} (${b.owner.email})` : "No owner"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
                {b.isDemo && <Badge>Demo</Badge>}
                {b.isFeatured && (
                  <Badge tone="accent">
                    <Star aria-hidden /> Featured
                  </Badge>
                )}
                {b._count.reports > 0 && (
                  <Badge tone="danger">
                    <Flag aria-hidden /> {b._count.reports} open{" "}
                    {b._count.reports === 1 ? "report" : "reports"}
                  </Badge>
                )}
                <span>
                  {status === "PENDING" && b.submittedAt
                    ? `Sent ${adminDate.format(b.submittedAt)}`
                    : `Updated ${adminDate.format(b.updatedAt)}`}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Pager page={page} pageSize={ADMIN_PAGE_SIZE} total={total} href={href} />
    </div>
  );
}
