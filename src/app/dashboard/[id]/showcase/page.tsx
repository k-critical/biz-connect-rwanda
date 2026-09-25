import { redirect } from "next/navigation";
import { canEditListing } from "@/lib/listing-status";
import { loadOwnedListing, showcaseDefaults, showcaseExamples } from "@/app/dashboard/listing-data";
import { ShowcaseForm } from "@/components/owner/showcase-form";

export default async function EditShowcasePage({ params }: PageProps<"/dashboard/[id]/showcase">) {
  const { business } = await loadOwnedListing((await params).id);
  if (!canEditListing(business.status)) redirect(`/dashboard/${business.id}`);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold">Menu and products</h1>
      <p className="mt-1 max-w-prose text-sm text-ink-muted">
        Show what you offer: dishes, products, rooms or services. Prices are in Rwandan francs and
        optional; keep them up to date, or leave them out.
      </p>
      <div className="mt-6">
        <ShowcaseForm
          businessId={business.id}
          defaults={showcaseDefaults(business)}
          examples={showcaseExamples(business)}
        />
      </div>
    </div>
  );
}
