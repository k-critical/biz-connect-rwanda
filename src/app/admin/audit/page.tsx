import type { Metadata } from "next";
import Link from "next/link";
import { auditActionLabel } from "@/lib/audit";
import { requireRole } from "@/server/auth/session";
import { ADMIN_PAGE_SIZE, getAuditLog } from "@/server/services/admin-service";
import { EmptyRow, Pager, adminDate, pageParam } from "@/components/admin/admin-ui";

export const metadata: Metadata = { title: "Audit log" };

const targetHref = (type: string, id: string) =>
  type === "business"
    ? `/admin/listings/${id}`
    : type === "claim"
      ? `/admin/claims/${id}`
      : "/admin/reports?status=RESOLVED";

function noteOf(details: unknown): string | null {
  return details && typeof details === "object" && "note" in details
    ? String((details as { note: unknown }).note)
    : null;
}

export default async function AdminAuditPage({ searchParams }: PageProps<"/admin/audit">) {
  await requireRole("ADMIN", "/admin/audit");
  const page = pageParam((await searchParams).page);
  const { items, total } = await getAuditLog(page);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Audit log</h1>
      <p className="max-w-prose text-ink-muted">
        Every decision an admin makes, newest first. Entries can&apos;t be edited or deleted from
        the site.
      </p>

      {items.length === 0 ? (
        <EmptyRow>No admin decisions yet.</EmptyRow>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-border bg-surface-2 text-ink-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  When
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Who
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  What
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((entry) => {
                const note = noteOf(entry.details);
                return (
                  <tr key={entry.id} className="align-top">
                    <td className="px-4 py-3 whitespace-nowrap text-ink-muted">
                      {adminDate.format(entry.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {entry.actor ? (
                        <>
                          <span className="font-semibold">{entry.actor.name}</span>
                          <span className="block text-ink-muted">{entry.actor.email}</span>
                        </>
                      ) : (
                        <span className="text-ink-muted">Deleted account</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={targetHref(entry.targetType, entry.targetId)}
                        className="font-semibold hover:text-primary"
                      >
                        {entry.summary}
                      </Link>
                      <span className="block text-ink-muted">{auditActionLabel(entry.action)}</span>
                      {note && <span className="mt-1 block whitespace-pre-line">“{note}”</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pager
        page={page}
        pageSize={ADMIN_PAGE_SIZE}
        total={total}
        href={(p) => `/admin/audit?page=${p}`}
      />
    </div>
  );
}
