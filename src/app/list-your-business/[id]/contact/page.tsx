import { contactDefaults, loadOwnedListing } from "@/app/dashboard/listing-data";
import { ContactForm } from "@/components/owner/contact-form";
import { WizardSteps } from "@/components/owner/wizard-steps";

export default async function WizardContactPage({
  params,
}: PageProps<"/list-your-business/[id]/contact">) {
  const { business } = await loadOwnedListing((await params).id);

  return (
    <>
      <WizardSteps current="contact" businessId={business.id} />
      <header className="mt-10">
        <h1 className="text-3xl font-bold sm:text-4xl">Contact and location</h1>
        <p className="mt-2 text-ink-muted">
          How customers reach {business.name}, and how they find it.
        </p>
      </header>
      <div className="mt-8">
        <ContactForm
          mode="wizard"
          businessId={business.id}
          districtName={business.district.name}
          defaults={contactDefaults(business)}
        />
      </div>
    </>
  );
}
