import { getDistrictOptions } from "@/server/services/directory-service";
import { detailsDefaults, loadOwnedListing } from "@/app/dashboard/listing-data";
import { DetailsForm } from "@/components/owner/details-form";
import { WizardSteps } from "@/components/owner/wizard-steps";

export default async function WizardDetailsPage({
  params,
}: PageProps<"/list-your-business/[id]/details">) {
  const { id } = await params;
  const [{ business }, districts] = await Promise.all([loadOwnedListing(id), getDistrictOptions()]);

  return (
    <>
      <WizardSteps current="details" businessId={business.id} />
      <header className="mt-10">
        <h1 className="text-3xl font-bold sm:text-4xl">The basics</h1>
        <p className="mt-2 text-ink-muted">What your business is called, what it does and where.</p>
      </header>
      <div className="mt-8">
        <DetailsForm
          mode="wizard"
          businessId={business.id}
          defaults={detailsDefaults(business)}
          districts={districts}
        />
      </div>
    </>
  );
}
