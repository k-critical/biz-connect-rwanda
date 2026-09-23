import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-20 sm:px-6">
      <EmptyState
        icon={SearchX}
        headingLevel={1}
        title="We couldn't find that page"
        description="The link may be old, or the page hasn't been built yet."
        action={<ButtonLink href="/">Go to the home page</ButtonLink>}
      />
    </div>
  );
}
