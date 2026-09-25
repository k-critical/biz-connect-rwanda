import { LISTING_STATUS, type ListingStatus } from "@/lib/listing-status";
import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: ListingStatus }) {
  const { label, tone } = LISTING_STATUS[status];
  return <Badge tone={tone}>{label}</Badge>;
}
