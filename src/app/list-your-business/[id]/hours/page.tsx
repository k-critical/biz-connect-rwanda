import { loadOwnedListing, managedPhotos } from "@/app/dashboard/listing-data";
import { HoursForm } from "@/components/owner/hours-form";
import { PhotoManager } from "@/components/owner/photo-manager";
import { WizardSteps } from "@/components/owner/wizard-steps";

export default async function WizardHoursPage({
  params,
}: PageProps<"/list-your-business/[id]/hours">) {
  const { business } = await loadOwnedListing((await params).id);

  return (
    <>
      <WizardSteps current="hours" businessId={business.id} />
      <header className="mt-10">
        <h1 className="text-3xl font-bold sm:text-4xl">Photos and hours</h1>
        <p className="mt-2 text-ink-muted">
          Photos and opening hours help customers decide to get in touch. Both are optional, and you
          can add them later.
        </p>
      </header>

      <section aria-labelledby="photos-heading" className="mt-10">
        <h2 id="photos-heading" className="text-2xl font-bold">
          Photos
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Photos save as soon as they upload. The first one is your cover photo.
        </p>
        <div className="mt-5">
          <PhotoManager businessId={business.id} photos={managedPhotos(business)} />
        </div>
      </section>

      <section aria-labelledby="hours-heading" className="mt-14">
        <h2 id="hours-heading" className="text-2xl font-bold">
          Opening hours
        </h2>
        <div className="mt-5">
          <HoursForm mode="wizard" businessId={business.id} defaults={business.openingHours} />
        </div>
      </section>
    </>
  );
}
