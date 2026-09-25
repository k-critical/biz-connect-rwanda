import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { formatPhone } from "@/lib/phone";
import { telHref } from "@/lib/safe-links";
import { requireRole } from "@/server/auth/session";
import { getClaimForAdmin } from "@/server/services/admin-service";
import { decideClaimAction } from "@/app/admin/actions";
import { adminDate } from "@/components/admin/admin-ui";
import { DecisionForm } from "@/components/admin/decision-form";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Claim" };

const STATUS = {
  PENDING: { label: "Waiting", tone: "accent" },
  APPROVED: { label: "Approved", tone: "success" },
  REJECTED: { label: "Turned down", tone: "danger" },
  WITHDRAWN: { label: "Withdrawn", tone: "neutral" },
} as const;

export default async function AdminClaimPage({ params }: PageProps<"/admin/claims/[id]">) {
  const { id } = await params;
  await requireRole("ADMIN", `/admin/claims/${id}`);
  const claim = await getClaimForAdmin(id);
  if (!claim) notFound();
  const evidenceUrl = `/admin/claims/${claim.id}/evidence`;
  const businessNumber = claim.business.whatsapp ?? claim.business.phone;

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Link
        href={`/admin/claims?status=${claim.status === "WITHDRAWN" ? "PENDING" : claim.status}`}
        className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden /> Claims
      </Link>

      <header className="flex flex-col gap-2">
        <Badge tone={STATUS[claim.status].tone} className="w-fit">
          {STATUS[claim.status].label}
        </Badge>
        <h1 className="text-3xl font-bold">
          {claim.user.name} wants to manage {claim.business.name}
        </h1>
        <p className="text-sm text-ink-muted">Sent {adminDate.format(claim.createdAt)}</p>
      </header>

      {claim.status === "PENDING" && claim.business.ownerId && (
        <Alert tone="error">
          Someone already manages this listing, so this claim can&apos;t be approved. Turn it down,
          or check the listing&apos;s owner first.
        </Alert>
      )}

      <dl className="grid gap-4 rounded-2xl border border-border bg-surface p-5 shadow-card sm:grid-cols-2">
        <div>
          <dt className="text-sm text-ink-muted">Person</dt>
          <dd className="font-semibold">{claim.user.name}</dd>
          <dd className="text-sm break-all">{claim.user.email}</dd>
          <dd className="text-sm text-ink-muted">
            Account created {adminDate.format(claim.user.createdAt)}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-ink-muted">Says they are</dt>
          <dd className="font-semibold">{claim.relationship}</dd>
          <dt className="mt-2 text-sm text-ink-muted">Phone to call</dt>
          <dd>
            <a href={telHref(claim.contactPhone)} className="font-semibold text-primary">
              {formatPhone(claim.contactPhone)}
            </a>
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-sm text-ink-muted">Their message</dt>
          <dd className="mt-1 whitespace-pre-line">{claim.message}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-sm text-ink-muted">Listing</dt>
          <dd>
            <Link
              href={`/admin/listings/${claim.business.id}`}
              className="font-semibold text-primary"
            >
              {claim.business.name}
            </Link>{" "}
            <span className="text-sm text-ink-muted">
              · {claim.business.district.name}
              {businessNumber && ` · number on the listing: ${formatPhone(businessNumber)}`}
            </span>
          </dd>
        </div>
      </dl>

      <section aria-labelledby="proof-heading" className="flex flex-col gap-3">
        <h2 id="proof-heading" className="text-xl font-bold">
          Proof
        </h2>
        {!claim.evidenceKey ? (
          <p className="text-ink-muted">No document was attached.</p>
        ) : claim.evidenceType === "application/pdf" ? (
          <a
            href={evidenceUrl}
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-border-strong px-4 py-3 font-semibold hover:bg-surface-2"
          >
            <FileText className="size-5" aria-hidden /> Download the PDF
            <Download className="size-4" aria-hidden />
          </a>
        ) : (
          // Private file served by an admin-only route; next/image would cache it publicly.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={evidenceUrl}
            alt={`Proof sent by ${claim.user.name}`}
            className="max-h-[32rem] w-auto rounded-xl border border-border object-contain"
          />
        )}
      </section>

      {claim.status === "PENDING" ? (
        <section
          aria-labelledby="decide-heading"
          className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-card"
        >
          <h2 id="decide-heading" className="text-xl font-bold">
            Decide
          </h2>
          {!claim.business.ownerId && (
            <DecisionForm
              action={decideClaimAction}
              fields={{ claimId: claim.id, decision: "approve" }}
              submitLabel={`Give ${claim.business.name} to ${claim.user.name}`}
              variant="success"
              confirm={`${claim.user.name} will be able to edit ${claim.business.name}. Continue?`}
            />
          )}
          <details className="rounded-xl border border-border p-3">
            <summary className="cursor-pointer text-sm font-semibold">Turn down</summary>
            <div className="mt-3">
              <DecisionForm
                action={decideClaimAction}
                fields={{ claimId: claim.id, decision: "reject" }}
                note="required"
                noteLabel="Why can't you approve it?"
                noteHint="Emailed to the person as written. Say what proof would help."
                submitLabel="Turn down"
                variant="secondary"
              />
            </div>
          </details>
        </section>
      ) : (
        claim.decisionNote && (
          <Alert tone="info">
            <p className="font-semibold">
              Decided {claim.decidedAt ? adminDate.format(claim.decidedAt) : ""}
            </p>
            <p className="whitespace-pre-line">{claim.decisionNote}</p>
          </Alert>
        )
      )}
    </div>
  );
}
