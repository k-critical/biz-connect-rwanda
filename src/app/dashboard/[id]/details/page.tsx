import { redirect } from "next/navigation";
import { canEditListing } from "@/lib/listing-status";
import { getDistrictOptions } from "@/server/services/directory-service";
import { detailsDefaults, loadOwnedListing } from "@/app/dashboard/listing-data";
import { DetailsForm } from "@/components/owner/details-form";

export default async function EditDetailsPage({ params }: PageProps<"/dashboard/[id]/details">) {
  const [{ business }, districts] = await Promise.all([
    loadOwnedListing((await params).id),
    getDistrictOptions(),
  ]);
  if (!canEditListing(business.status)) redirect(`/dashboard/${business.id}`);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold">The basics</h1>
      {business.status === "APPROVED" && (
        <p className="mt-1 text-sm text-ink-muted">
          Your web address stays <span className="font-semibold">/b/{business.slug}</span> even if
          you change the name, so links you&apos;ve shared keep working.
        </p>
      )}
      <div className="mt-6">
        <DetailsForm
          mode="edit"
          businessId={business.id}
          defaults={detailsDefaults(business)}
          districts={districts}
        />
      </div>
    </div>
  );
}
