import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { canEditListing } from "@/lib/listing-status";
import { loadOwnedListing } from "@/app/dashboard/listing-data";
import { ListingTabs } from "@/components/owner/listing-tabs";
import { StatusBadge } from "@/components/owner/status-badge";

export async function generateMetadata({ params }: LayoutProps<"/dashboard/[id]">) {
  const { business } = await loadOwnedListing((await params).id);
  return { title: business.name };
}

export default async function ListingLayout({ children, params }: LayoutProps<"/dashboard/[id]">) {
  const { business } = await loadOwnedListing((await params).id);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/dashboard"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden /> All your businesses
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <StatusBadge status={business.status} />
          <p className="mt-2 font-display text-3xl font-bold break-words sm:text-4xl">
            {business.name}
          </p>
        </div>
        {business.status === "APPROVED" && (
          <Link
            href={`/b/${business.slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            View live listing <ExternalLink className="size-4" aria-hidden />
          </Link>
        )}
      </header>

      <ListingTabs businessId={business.id} locked={!canEditListing(business.status)} />

      <div>{children}</div>
    </div>
  );
}
