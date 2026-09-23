import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategory, isCategorySlug } from "@/config/categories";
import { CategoryIcon } from "@/components/category-icon";
import { DirectoryListing } from "@/components/directory/directory-listing";
import { parseExploreParams, rawQueryString } from "@/lib/explore-params";

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<"/c/[category]">): Promise<Metadata> {
  const { category } = await params;
  if (!isCategorySlug(category)) return {};
  const { name } = getCategory(category);
  const filtered = rawQueryString(await searchParams) !== "";
  return {
    title: `${name} in Rwanda`,
    description: `Find ${name.toLowerCase()} across Rwanda and contact them directly on WhatsApp or by phone.`,
    alternates: { canonical: `/c/${category}` },
    ...(filtered && { robots: { index: false, follow: true } }),
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/c/[category]">) {
  const { category } = await params;
  if (!isCategorySlug(category)) notFound();

  const filters = parseExploreParams({ ...(await searchParams), category });
  const { name } = getCategory(category);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-ink-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-primary">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/explore" className="hover:text-primary">
              Explore
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="font-semibold text-ink">
            {name}
          </li>
        </ol>
      </nav>
      <header className="mb-8 flex items-center gap-4">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-surface-2 text-primary">
          <CategoryIcon slug={category} className="size-7" />
        </span>
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">{name}</h1>
          <p className="mt-1 text-ink-muted">Listed across Rwanda, contacted directly.</p>
        </div>
      </header>
      <DirectoryListing filters={filters} basePath={`/c/${category}`} lockedCategory />
    </div>
  );
}
