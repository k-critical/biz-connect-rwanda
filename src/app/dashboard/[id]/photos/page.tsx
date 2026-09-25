import { redirect } from "next/navigation";
import { canEditListing } from "@/lib/listing-status";
import { loadOwnedListing, managedPhotos } from "@/app/dashboard/listing-data";
import { PhotoManager } from "@/components/owner/photo-manager";

export default async function EditPhotosPage({ params }: PageProps<"/dashboard/[id]/photos">) {
  const { business } = await loadOwnedListing((await params).id);
  if (!canEditListing(business.status)) redirect(`/dashboard/${business.id}`);

  return (
    <div>
      <h1 className="text-2xl font-bold">Photos</h1>
      <p className="mt-1 max-w-prose text-sm text-ink-muted">
        The first photo is your cover, shown on your card in search results. Describe each photo in
        a few words so people using screen readers know what it shows.
      </p>
      <div className="mt-6">
        <PhotoManager businessId={business.id} photos={managedPhotos(business)} />
      </div>
    </div>
  );
}
