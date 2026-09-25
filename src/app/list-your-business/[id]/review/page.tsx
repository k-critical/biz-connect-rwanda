import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { LISTING_STATUS, isReadyToSubmit } from "@/lib/listing-status";
import { checklistFor } from "@/server/services/listing-service";
import { loadOwnedListing } from "@/app/dashboard/listing-data";
import { ListingChecklist } from "@/components/owner/listing-checklist";
import { SubmitListingForm } from "@/components/owner/submit-listing-form";
import { WizardSteps } from "@/components/owner/wizard-steps";
import { Alert } from "@/components/ui/alert";

export default async function WizardReviewPage({
  params,
}: PageProps<"/list-your-business/[id]/review">) {
  const { business } = await loadOwnedListing((await params).id);
  const checklist = checklistFor(business);
  const ready = isReadyToSubmit(checklist);

  return (
    <>
      <WizardSteps current="review" businessId={business.id} />
      <header className="mt-10">
        <h1 className="text-3xl font-bold sm:text-4xl">Review and send</h1>
        <p className="mt-2 text-ink-muted">
          Check everything looks right, then send {business.name} for review.
        </p>
      </header>

      {business.status === "REJECTED" && (
        <Alert tone="error" className="mt-6">
          {LISTING_STATUS.REJECTED.help}
        </Alert>
      )}

      <section aria-labelledby="checklist-heading" className="mt-8">
        <h2 id="checklist-heading" className="text-xl font-bold">
          Your listing so far
        </h2>
        <div className="mt-4">
          <ListingChecklist
            items={checklist}
            hrefBase={`/list-your-business/${business.id}`}
            wizard
          />
        </div>
        <Link
          href={`/dashboard/${business.id}/preview`}
          target="_blank"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          See how visitors will see it <ExternalLink className="size-4" aria-hidden />
          <span className="sr-only">(opens in a new tab)</span>
        </Link>
      </section>

      <section
        aria-labelledby="send-heading"
        className="mt-10 rounded-2xl border border-border bg-surface p-6 shadow-card"
      >
        <h2 id="send-heading" className="text-xl font-bold">
          Send for review
        </h2>
        <p className="mt-2 text-sm text-ink-muted">
          An admin checks every new listing before it appears in the directory, and emails you when
          it&apos;s live. You can keep editing while you wait.
        </p>
        {!ready && (
          <Alert tone="info" className="mt-4">
            Add at least one way for customers to reach you first.
          </Alert>
        )}
        <div className="mt-5">
          <SubmitListingForm businessId={business.id} ready={ready} />
        </div>
      </section>
    </>
  );
}
