import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { REPORT_REASONS, auditActionLabel } from "@/lib/audit";
import { LISTING_STATUS } from "@/lib/listing-status";
import { formatPhone } from "@/lib/phone";
import { requireRole } from "@/server/auth/session";
import { getListingForAdmin } from "@/server/services/admin-service";
import { toBusinessProfile } from "@/server/services/directory-service";
import { decideListingAction, featureListingAction } from "@/app/admin/actions";
import { adminDate } from "@/components/admin/admin-ui";
import { DecisionForm } from "@/components/admin/decision-form";
import { StatusBadge } from "@/components/owner/status-badge";
import { BusinessProfileView } from "@/components/profile/business-profile-view";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export async function generateMetadata({ params }: PageProps<"/admin/listings/[id]">) {
  const found = await getListingForAdmin((await params).id);
  return { title: found?.listing.name ?? "Listing" };
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 shadow-card">
      <h2 className="font-sans text-base font-bold">{title}</h2>
      {children}
    </section>
  );
}

export default async function AdminListingPage({ params }: PageProps<"/admin/listings/[id]">) {
  const { id } = await params;
  await requireRole("ADMIN", `/admin/listings/${id}`);
  const found = await getListingForAdmin(id);
  if (!found) notFound();
  const { listing: b, history } = found;
  const fields = { businessId: b.id };

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/admin/listings?status=${b.status}`}
        className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden /> {LISTING_STATUS[b.status].label} listings
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={b.status} />
            {b.isDemo && <Badge>Demo data</Badge>}
            {b.isFeatured && <Badge tone="accent">Featured</Badge>}
          </div>
          <h1 className="text-3xl font-bold break-words">{b.name}</h1>
          <p className="text-sm text-ink-muted">
            {b.submittedAt ? `Sent for review ${adminDate.format(b.submittedAt)} · ` : ""}
            Last changed {adminDate.format(b.updatedAt)}
          </p>
        </div>
        {b.status === "APPROVED" && (
          <Link
            href={`/b/${b.slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            Open the public page <ExternalLink className="size-4" aria-hidden />
          </Link>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
        <div className="order-2 overflow-hidden rounded-2xl border border-border lg:order-1">
          <BusinessProfileView business={toBusinessProfile(b)} preview />
        </div>

        <aside className="order-1 flex flex-col gap-4 lg:sticky lg:top-24 lg:order-2">
          <Panel title="Decision">
            {b.status === "DRAFT" && (
              <p className="text-sm text-ink-muted">
                The owner hasn&apos;t sent this listing for review yet.
              </p>
            )}
            {(b.status === "PENDING" || b.status === "REJECTED") && (
              <>
                <p className="text-sm text-ink-muted">
                  Check the name, category, contact details and photos look genuine and suitable.
                </p>
                <DecisionForm
                  action={decideListingAction}
                  fields={{ ...fields, decision: "approve" }}
                  submitLabel={b.status === "REJECTED" ? "Approve anyway" : "Approve and publish"}
                  variant="success"
                />
              </>
            )}
            {b.status === "PENDING" && (
              <details className="rounded-xl border border-border p-3">
                <summary className="cursor-pointer text-sm font-semibold">Ask for changes</summary>
                <div className="mt-3">
                  <DecisionForm
                    action={decideListingAction}
                    fields={{ ...fields, decision: "reject" }}
                    note="required"
                    noteLabel="What should the owner change?"
                    noteHint="Emailed to the owner exactly as you write it. Be specific and kind."
                    submitLabel="Send back to the owner"
                    variant="secondary"
                  />
                </div>
              </details>
            )}
            {b.status === "APPROVED" && (
              <>
                <DecisionForm
                  action={featureListingAction}
                  fields={{ ...fields, featured: b.isFeatured ? "no" : "yes" }}
                  submitLabel={b.isFeatured ? "Stop featuring" : "Feature on the home page"}
                  variant="secondary"
                />
                <details className="rounded-xl border border-danger/40 p-3">
                  <summary className="cursor-pointer text-sm font-semibold text-danger">
                    Suspend this listing
                  </summary>
                  <div className="mt-3">
                    <DecisionForm
                      action={decideListingAction}
                      fields={{ ...fields, decision: "suspend" }}
                      note="required"
                      noteLabel="Why is it being hidden?"
                      noteHint="Emailed to the owner. The listing disappears from the site at once."
                      submitLabel="Suspend"
                      variant="danger"
                      confirm={`Hide ${b.name} from the site?`}
                    />
                  </div>
                </details>
              </>
            )}
            {b.status === "SUSPENDED" && (
              <DecisionForm
                action={decideListingAction}
                fields={{ ...fields, decision: "restore" }}
                submitLabel="Restore and publish"
                variant="success"
              />
            )}
            {b.reviewNote && (b.status === "REJECTED" || b.status === "SUSPENDED") && (
              <Alert tone="info">
                <p className="font-semibold">Last note to the owner</p>
                <p className="whitespace-pre-line">{b.reviewNote}</p>
              </Alert>
            )}
          </Panel>

          <Panel title="Owner">
            {b.owner ? (
              <dl className="flex flex-col gap-1 text-sm">
                <dt className="sr-only">Name</dt>
                <dd className="font-semibold">{b.owner.name}</dd>
                <dt className="sr-only">Email</dt>
                <dd className="break-all">{b.owner.email}</dd>
                <dt className="sr-only">Member since</dt>
                <dd className="text-ink-muted">
                  Account created {adminDate.format(b.owner.createdAt)}
                </dd>
              </dl>
            ) : (
              <p className="text-sm text-ink-muted">
                Nobody manages this listing.
                {b.claimRequests.length > 0 && (
                  <>
                    {" "}
                    <Link
                      href="/admin/claims?status=PENDING"
                      className="font-semibold text-primary"
                    >
                      {b.claimRequests.length} pending{" "}
                      {b.claimRequests.length === 1 ? "claim" : "claims"}
                    </Link>
                  </>
                )}
              </p>
            )}
            {(b.whatsapp || b.phone) && (
              <p className="text-sm text-ink-muted">
                Business number: {formatPhone((b.whatsapp ?? b.phone)!)}
              </p>
            )}
          </Panel>

          {b.reports.length > 0 && (
            <Panel title={`Open reports (${b.reports.length})`}>
              <ul className="flex flex-col gap-3 text-sm">
                {b.reports.map((report) => (
                  <li key={report.id}>
                    <p className="font-semibold">{REPORT_REASONS[report.reason]}</p>
                    <p className="text-ink-muted">{report.message}</p>
                  </li>
                ))}
              </ul>
              <Link
                href="/admin/reports?status=OPEN"
                className="text-sm font-semibold text-primary"
              >
                Handle reports
              </Link>
            </Panel>
          )}

          <Panel title="History">
            {history.length === 0 ? (
              <p className="text-sm text-ink-muted">No admin decisions yet.</p>
            ) : (
              <ol className="flex flex-col gap-2 text-sm">
                {history.map((entry) => (
                  <li key={entry.id}>
                    <span className="font-semibold">{auditActionLabel(entry.action)}</span>
                    <span className="text-ink-muted">
                      {" "}
                      · {entry.actor?.name ?? "Former admin"} · {adminDate.format(entry.createdAt)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </aside>
      </div>
    </div>
  );
}
