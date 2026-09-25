import { redirect } from "next/navigation";
import { canEditListing } from "@/lib/listing-status";
import { loadOwnedListing } from "@/app/dashboard/listing-data";
import { HoursForm } from "@/components/owner/hours-form";

export default async function EditHoursPage({ params }: PageProps<"/dashboard/[id]/hours">) {
  const { business } = await loadOwnedListing((await params).id);
  if (!canEditListing(business.status)) redirect(`/dashboard/${business.id}`);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold">Opening hours</h1>
      <div className="mt-6">
        <HoursForm mode="edit" businessId={business.id} defaults={business.openingHours} />
      </div>
    </div>
  );
}
