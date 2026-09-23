import type { Metadata } from "next";
import { DirectoryListing } from "@/components/directory/directory-listing";
import { parseExploreParams, rawQueryString } from "@/lib/explore-params";

export async function generateMetadata({ searchParams }: PageProps<"/explore">): Promise<Metadata> {
  const filtered = rawQueryString(await searchParams) !== "";
  return {
    title: "Explore businesses",
    description:
      "Search and filter small businesses across Rwanda by category, district and price.",
    alternates: { canonical: "/explore" },
    // Endless filter combinations shouldn't be indexed as separate pages.
    ...(filtered && { robots: { index: false, follow: true } }),
  };
}

export default async function ExplorePage({ searchParams }: PageProps<"/explore">) {
  const filters = parseExploreParams(await searchParams);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-bold sm:text-4xl">Explore businesses</h1>
        <p className="mt-2 text-ink-muted">
          Search by name, dish, service or place, then contact the business directly.
        </p>
      </header>
      <DirectoryListing filters={filters} basePath="/explore" />
    </div>
  );
}
