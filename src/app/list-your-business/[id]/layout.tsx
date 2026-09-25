import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { canSubmitListing } from "@/lib/listing-status";
import { loadOwnedListing } from "@/app/dashboard/listing-data";

export const metadata: Metadata = { title: "List your business", robots: { index: false } };

/** The wizard is for listings that haven't been sent yet; the rest are edited on the dashboard. */
export default async function WizardLayout({
  children,
  params,
}: LayoutProps<"/list-your-business/[id]">) {
  const { id } = await params;
  const { business } = await loadOwnedListing(id);
  if (!canSubmitListing(business.status)) redirect(`/dashboard/${business.id}`);

  return <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">{children}</div>;
}
