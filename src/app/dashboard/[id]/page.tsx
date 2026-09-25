import Link from "next/link";
import {
  Clock,
  Image as ImageIcon,
  ListChecks,
  MapPin,
  Phone,
  UtensilsCrossed,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  LISTING_STATUS,
  canDeleteListing,
  canEditListing,
  canSubmitListing,
  isReadyToSubmit,
} from "@/lib/listing-status";
import { formatPhone } from "@/lib/phone";
import { checklistFor } from "@/server/services/listing-service";
import { loadOwnedListing } from "@/app/dashboard/listing-data";
import { DeleteListingForm } from "@/components/owner/delete-listing-form";
import { ListingChecklist } from "@/components/owner/listing-checklist";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";

function SummaryCard({
  icon: Icon,
  title,
  href,
  children,
  editable,
}: {
  icon: LucideIcon;
  title: string;
  href: string;
  children: React.ReactNode;
  editable: boolean;
}) {
  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 font-sans text-base font-bold">
          <Icon className="size-4 text-ink-muted" aria-hidden /> {title}
        </h2>
        {editable && (
          <Link href={href} className="text-sm font-semibold text-primary hover:underline">
            Edit<span className="sr-only"> {title.toLowerCase()}</span>
          </Link>
        )}
      </div>
      <div className="text-sm text-ink-muted">{children}</div>
    </section>
  );
}

export default async function ListingOverviewPage({
  params,
  searchParams,
}: PageProps<"/dashboard/[id]">) {
  const [{ business: b }, query] = await Promise.all([
    loadOwnedListing((await params).id),
    searchParams,
  ]);
  const checklist = checklistFor(b);
  const editable = canEditListing(b.status);
  const base = `/dashboard/${b.id}`;
  const openDays = new Set(b.openingHours.map((h) => h.dayOfWeek)).size;
  const itemCount = b.showcaseSections.reduce((sum, s) => sum + s.items.length, 0);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="sr-only">Overview of {b.name}</h1>

      {query.submitted && b.status === "PENDING" && (
        <Alert tone="success">
          Sent! An admin will check {b.name} and email you when it&apos;s live. We also sent you a
          confirmation email.
        </Alert>
      )}

      <Alert tone={b.status === "REJECTED" || b.status === "SUSPENDED" ? "error" : "info"}>
        <p>{LISTING_STATUS[b.status].help}</p>
        {canSubmitListing(b.status) && (
          <div className="flex flex-wrap gap-2">
            {b.status === "DRAFT" && (
              <ButtonLink href={`/list-your-business/${b.id}/details`} size="sm">
                Continue setup
              </ButtonLink>
            )}
            <ButtonLink
              href={`/list-your-business/${b.id}/review`}
              size="sm"
              variant={b.status === "DRAFT" ? "secondary" : "primary"}
            >
              {isReadyToSubmit(checklist) ? "Review and send" : "See what's missing"}
            </ButtonLink>
          </div>
        )}
      </Alert>

      {editable && (
        <section aria-labelledby="checklist-heading">
          <h2 id="checklist-heading" className="text-xl font-bold">
            Make your listing complete
          </h2>
          <div className="mt-4">
            <ListingChecklist items={checklist} hrefBase={base} />
          </div>
        </section>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <SummaryCard icon={Phone} title="Contact" href={`${base}/contact`} editable={editable}>
          {b.whatsapp || b.phone || b.email ? (
            <ul className="flex flex-col gap-1">
              {b.whatsapp && <li>WhatsApp {formatPhone(b.whatsapp)}</li>}
              {b.phone && <li>Calls {formatPhone(b.phone)}</li>}
              {b.email && <li className="break-all">{b.email}</li>}
            </ul>
          ) : (
            "No contact details yet."
          )}
        </SummaryCard>
        <SummaryCard icon={MapPin} title="Location" href={`${base}/contact`} editable={editable}>
          {[b.sector, b.district.name].filter(Boolean).join(", ")}
          {b.address && <span className="block">{b.address}</span>}
          <span className="block">
            {b.latitude !== null ? "Pinned on the map" : "No map pin yet"}
          </span>
        </SummaryCard>
        <SummaryCard icon={Clock} title="Opening hours" href={`${base}/hours`} editable={editable}>
          {openDays > 0 ? `Open ${openDays} day${openDays === 1 ? "" : "s"} a week` : "Not listed"}
        </SummaryCard>
        <SummaryCard icon={ImageIcon} title="Photos" href={`${base}/photos`} editable={editable}>
          {b.photos.length > 0
            ? `${b.photos.length} photo${b.photos.length === 1 ? "" : "s"}`
            : "No photos yet"}
        </SummaryCard>
        <SummaryCard
          icon={UtensilsCrossed}
          title="Menu and products"
          href={`${base}/showcase`}
          editable={editable}
        >
          {itemCount > 0
            ? `${itemCount} item${itemCount === 1 ? "" : "s"} in ${b.showcaseSections.length} section${b.showcaseSections.length === 1 ? "" : "s"}`
            : "Nothing listed yet"}
        </SummaryCard>
        <SummaryCard
          icon={ListChecks}
          title="The basics"
          href={`${base}/details`}
          editable={editable}
        >
          <span className="line-clamp-2">{b.tagline}</span>
        </SummaryCard>
      </div>

      {canDeleteListing(b.status) && (
        <section
          aria-labelledby="delete-heading"
          className="rounded-2xl border border-danger/40 p-5"
        >
          <h2 id="delete-heading" className="font-sans text-base font-bold">
            Delete this listing
          </h2>
          <p className="mt-1 mb-4 text-sm text-ink-muted">
            Removes the draft and its photos for good.
          </p>
          <DeleteListingForm businessId={b.id} name={b.name} />
        </section>
      )}
    </div>
  );
}
