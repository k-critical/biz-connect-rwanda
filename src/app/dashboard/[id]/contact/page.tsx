import { redirect } from "next/navigation";
import { canEditListing } from "@/lib/listing-status";
import { contactDefaults, loadOwnedListing } from "@/app/dashboard/listing-data";
import { ContactForm } from "@/components/owner/contact-form";

export default async function EditContactPage({ params }: PageProps<"/dashboard/[id]/contact">) {
  const { business } = await loadOwnedListing((await params).id);
  if (!canEditListing(business.status)) redirect(`/dashboard/${business.id}`);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold">Contact and location</h1>
      <div className="mt-6">
        <ContactForm
          mode="edit"
          businessId={business.id}
          districtName={business.district.name}
          defaults={contactDefaults(business)}
        />
      </div>
    </div>
  );
}
