import type { Metadata } from "next";
import Link from "next/link";
import { REPORT_REASONS } from "@/lib/audit";
import { LISTING_STATUS } from "@/lib/listing-status";
import { requireRole } from "@/server/auth/session";
import { ADMIN_PAGE_SIZE, getReportQueue } from "@/server/services/admin-service";
import { closeReportAction } from "@/app/admin/actions";
import {
  EmptyRow,
  Pager,
  StatusTabs,
  adminDate,
  oneOf,
  pageParam,
} from "@/components/admin/admin-ui";
import { DecisionForm } from "@/components/admin/decision-form";

export const metadata: Metadata = { title: "Reports" };

const STATUSES = ["OPEN", "RESOLVED", "DISMISSED"] as const;
const LABELS = { OPEN: "Open", RESOLVED: "Resolved", DISMISSED: "Dismissed" } as const;

export default async function AdminReportsPage({ searchParams }: PageProps<"/admin/reports">) {
  await requireRole("ADMIN", "/admin/reports");
  const params = await searchParams;
  const status = oneOf(params.status, STATUSES, "OPEN");
  const page = pageParam(params.page);
  const { items, total } = await getReportQueue(status, page);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Reports</h1>
      <p className="max-w-prose text-ink-muted">
        Visitors telling us something is wrong with a listing. Fix or suspend the listing if needed,
        then mark the report as resolved. Reporters aren&apos;t emailed.
      </p>
      <StatusTabs
        basePath="/admin/reports"
        current={status}
        options={STATUSES.map((value) => ({ value, label: LABELS[value] }))}
      />

      {items.length === 0 ? (
        <EmptyRow>{status === "OPEN" ? "No open reports." : "No reports here."}</EmptyRow>
      ) : (
        <ul className="flex flex-col gap-4">
          {items.map((report) => (
            <li
              key={report.id}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 shadow-card"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-sans text-lg font-bold">{REPORT_REASONS[report.reason]}</h2>
                <span className="text-sm text-ink-muted">{adminDate.format(report.createdAt)}</span>
              </div>
              <p className="text-sm">
                About{" "}
                <Link
                  href={`/admin/listings/${report.business.id}`}
                  className="font-semibold text-primary hover:underline"
                >
                  {report.business.name}
                </Link>{" "}
                <span className="text-ink-muted">
                  ({LISTING_STATUS[report.business.status].label}) · from{" "}
                  {report.reporter
                    ? `${report.reporter.name} (${report.reporter.email})`
                    : "a deleted account"}
                </span>
              </p>
              <p className="whitespace-pre-line">{report.message}</p>

              {report.status === "OPEN" ? (
                <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
                  <DecisionForm
                    action={closeReportAction}
                    fields={{ reportId: report.id, outcome: "resolve" }}
                    note="optional"
                    noteLabel="What did you do? (optional)"
                    submitLabel="Mark as resolved"
                    variant="success"
                  />
                  <DecisionForm
                    action={closeReportAction}
                    fields={{ reportId: report.id, outcome: "dismiss" }}
                    note="optional"
                    noteLabel="Why dismiss it? (optional)"
                    submitLabel="Dismiss"
                    variant="secondary"
                  />
                </div>
              ) : (
                <p className="border-t border-border pt-3 text-sm text-ink-muted">
                  {LABELS[report.status]}
                  {report.resolvedAt && ` ${adminDate.format(report.resolvedAt)}`}
                  {report.resolutionNote && `: ${report.resolutionNote}`}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <Pager
        page={page}
        pageSize={ADMIN_PAGE_SIZE}
        total={total}
        href={(p) => `/admin/reports?status=${status}&page=${p}`}
      />
    </div>
  );
}
