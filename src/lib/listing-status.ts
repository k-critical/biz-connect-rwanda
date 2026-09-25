import type { BadgeTone } from "@/components/ui/badge";

export type ListingStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";

export const LISTING_STATUS: Record<
  ListingStatus,
  { label: string; tone: BadgeTone; help: string }
> = {
  DRAFT: {
    label: "Draft",
    tone: "neutral",
    help: "Only you can see this listing. Finish the steps, then send it for review.",
  },
  PENDING: {
    label: "Waiting for review",
    tone: "accent",
    help: "An admin will check it and email you. You can keep improving it in the meantime.",
  },
  APPROVED: {
    label: "Live",
    tone: "success",
    help: "Everyone can find this listing. Changes you save appear straight away.",
  },
  REJECTED: {
    label: "Needs changes",
    tone: "danger",
    help: "An admin asked for changes. Update the listing, then send it for review again.",
  },
  SUSPENDED: {
    label: "Suspended",
    tone: "danger",
    help: "This listing is hidden and can't be edited. Contact the BizConnect team to find out why.",
  },
};

export const canEditListing = (status: ListingStatus) => status !== "SUSPENDED";
export const canSubmitListing = (status: ListingStatus) =>
  status === "DRAFT" || status === "REJECTED";
export const canDeleteListing = (status: ListingStatus) =>
  status === "DRAFT" || status === "REJECTED";
/** Once a listing has been public, its address stays the same so shared links keep working. */
export const canChangeSlug = (status: ListingStatus) =>
  status !== "APPROVED" && status !== "SUSPENDED";

export type ChecklistItem = {
  key: "details" | "contact" | "hours" | "photos" | "location" | "showcase";
  label: string;
  done: boolean;
  required: boolean;
};

export function listingChecklist(listing: {
  whatsapp: string | null;
  phone: string | null;
  email: string | null;
  latitude: unknown;
  hoursCount: number;
  photoCount: number;
  showcaseCount: number;
}): ChecklistItem[] {
  return [
    { key: "details", label: "Name, category and description", done: true, required: true },
    {
      key: "contact",
      label: "At least one way to reach you",
      done: Boolean(listing.whatsapp || listing.phone || listing.email),
      required: true,
    },
    { key: "hours", label: "Opening hours", done: listing.hoursCount > 0, required: false },
    { key: "photos", label: "At least one photo", done: listing.photoCount > 0, required: false },
    { key: "location", label: "Pin on the map", done: listing.latitude != null, required: false },
    {
      key: "showcase",
      label: "Menu, products or services",
      done: listing.showcaseCount > 0,
      required: false,
    },
  ];
}

export const isReadyToSubmit = (checklist: ChecklistItem[]) =>
  checklist.every((item) => item.done || !item.required);
