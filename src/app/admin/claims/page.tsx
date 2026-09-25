import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/server/auth/session";
import { ADMIN_PAGE_SIZE, getClaimQueue } from "@/server/services/admin-service";
import {
  EmptyRow,
  Pager,
  StatusTabs,
  adminDate,
  oneOf,
  pageParam,
} from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Claims" };

const STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
const LABELS = { PENDING: "Waiting", APPROVED: "Approved", REJECTED: "Turned down" } as const;

export default async function AdminClaimsPage({ searchParams }: PageProps<"/admin/claims">) {
  await requireRole("ADMIN", "/admin/claims");
  const params = await searchParams;
  const status = oneOf(params.status, STATUSES, "PENDING");
  const page = pageParam(params.page);
  const { items, total } = await getClaimQueue(status, page);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Claims</h1>
      <p className="max-w-prose text-ink-muted">
        People asking to manage a listing that has no owner. Check their proof, and call the number
        they gave if you&apos;re unsure.
      </p>
      <StatusTabs
        basePath="/admin/claims"
        current={status}
        options={STATUSES.map((value) => ({ value, label: LABELS[value] }))}
      />

      {items.length === 0 ? (
        <EmptyRow>{status === "PENDING" ? "No claims waiting." : "No claims here."}</EmptyRow>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
          {items.map((claim) => (
            <li
              key={claim.id}
              className="relative flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-4 hover:bg-surface-2/50"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Link
                  href={`/admin/claims/${claim.id}`}
                  className="font-semibold after:absolute after:inset-0 hover:text-primary"
                >
                  {claim.business.name}
                </Link>
                <p className="text-sm text-ink-muted">
                  {claim.user.name} ({claim.user.email}) · {claim.relationship}
                </p>
              </div>
              {status === "PENDING" && claim.business.ownerId && (
                <Badge tone="danger">Listing already has an owner</Badge>
              )}
              <span className="text-sm text-ink-muted">{adminDate.format(claim.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}

      <Pager
        page={page}
        pageSize={ADMIN_PAGE_SIZE}
        total={total}
        href={(p) => `/admin/claims?status=${status}&page=${p}`}
      />
    </div>
  );
}
