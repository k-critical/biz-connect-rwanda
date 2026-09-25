import { Eye } from "lucide-react";
import { LISTING_STATUS } from "@/lib/listing-status";
import { toBusinessProfile } from "@/server/services/directory-service";
import { loadOwnedListing } from "@/app/dashboard/listing-data";
import { BusinessProfileView } from "@/components/profile/business-profile-view";
import { Alert } from "@/components/ui/alert";

export default async function ListingPreviewPage({ params }: PageProps<"/dashboard/[id]/preview">) {
  const { business } = await loadOwnedListing((await params).id);

  return (
    <div className="flex flex-col gap-6">
      <Alert tone="info">
        <p className="inline-flex items-center gap-2 font-semibold">
          <Eye className="size-4" aria-hidden /> Preview
        </p>
        <p>
          This is how visitors will see {business.name}. Current status:{" "}
          <span className="font-semibold">{LISTING_STATUS[business.status].label}</span>
        </p>
      </Alert>
      {/* Framed, so it's clear where the preview starts and ends. */}
      <div className="-mx-4 overflow-hidden rounded-none border-y border-border sm:mx-0 sm:rounded-2xl sm:border">
        <BusinessProfileView business={toBusinessProfile(business)} preview />
      </div>
    </div>
  );
}
