import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getHomePageData } from "@/server/services/directory-service";
import { ImigongoPattern } from "@/components/brand/imigongo-pattern";
import { BusinessGrid } from "@/components/business/business-grid";
import { CategoryIcon } from "@/components/category-icon";
import { SearchForm } from "@/components/directory/search-form";
import { ButtonLink } from "@/components/ui/button";

// Featured cards show "open now", which depends on the current time.
export const dynamic = "force-dynamic";

const quickLinks = [
  { slug: "restaurants", label: "Places to eat" },
  { slug: "hotels", label: "Places to stay" },
  { slug: "beauty", label: "Salons" },
  { slug: "transport", label: "Getting around" },
] as const;

const steps = [
  {
    title: "Search or browse",
    text: "Look up a name, a dish or a service, or browse by category and district.",
  },
  {
    title: "Check the details",
    text: "See opening hours, prices, what's on offer and exactly where they are.",
  },
  {
    title: "Contact them directly",
    text: "Message on WhatsApp or call. No middleman, no booking fees.",
  },
];

export default async function Home() {
  const { featured, categories, stats } = await getHomePageData();

  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <ImigongoPattern className="absolute inset-y-0 right-0 hidden w-[28%] text-surface-2 lg:block" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.5fr_1fr] lg:py-24">
          <div className="flex flex-col gap-6">
            <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">
              Rwanda&apos;s small-business directory
            </p>
            <h1 className="text-4xl leading-[1.05] font-bold sm:text-6xl">
              Every local business, one tap away.
            </h1>
            <p className="max-w-xl text-lg text-ink-muted">
              Find restaurants, guesthouses, salons, tailors and more near you, then message them
              straight on WhatsApp.
            </p>
            <SearchForm size="lg" />
            <ul className="flex flex-wrap gap-2" aria-label="Popular categories">
              {quickLinks.map((link) => (
                <li key={link.slug}>
                  <Link
                    href={`/c/${link.slug}`}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-sm font-semibold text-ink hover:border-primary hover:text-primary"
                  >
                    <CategoryIcon slug={link.slug} className="size-4" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <dl className="grid grid-cols-3 gap-4 rounded-2xl border border-border bg-surface p-6 shadow-lift lg:grid-cols-1 lg:gap-6 lg:p-8">
            <div className="flex flex-col justify-between gap-1">
              <dt className="text-sm text-ink-muted">Businesses listed</dt>
              <dd className="font-display text-4xl font-bold text-ink">{stats.businesses}</dd>
            </div>
            <div className="flex flex-col justify-between gap-1">
              <dt className="text-sm text-ink-muted">Districts covered</dt>
              <dd className="font-display text-4xl font-bold text-ink">
                {stats.districts}
                <span className="text-lg text-ink-subtle"> / 30</span>
              </dd>
            </div>
            <div className="flex flex-col justify-between gap-1">
              <dt className="text-sm text-ink-muted">Categories</dt>
              <dd className="font-display text-4xl font-bold text-ink">{stats.categories}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section
        aria-labelledby="categories-heading"
        className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6"
      >
        <h2 id="categories-heading" className="text-3xl font-bold">
          Browse by category
        </h2>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {categories.map((category) => (
            <li key={category.slug}>
              <Link
                href={`/c/${category.slug}`}
                className="group flex h-full items-center gap-4 rounded-2xl border border-border bg-surface p-4 transition-shadow hover:shadow-lift"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-primary transition-colors group-hover:bg-primary group-hover:text-on-primary">
                  <CategoryIcon slug={category.slug} className="size-6" />
                </span>
                <span className="flex flex-col">
                  <span className="font-semibold text-ink">{category.name}</span>
                  <span className="text-sm text-ink-muted">
                    {category.count === 0
                      ? "Be the first"
                      : `${category.count} ${category.count === 1 ? "business" : "businesses"}`}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {featured.length > 0 && (
        <section
          aria-labelledby="featured-heading"
          className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6"
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="featured-heading" className="text-3xl font-bold">
              Featured businesses
            </h2>
            <Link
              href="/explore"
              className="inline-flex items-center gap-1.5 font-semibold text-primary underline-offset-4 hover:underline"
            >
              See everything <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <div className="mt-8">
            <BusinessGrid businesses={featured} />
          </div>
        </section>
      )}

      <section aria-labelledby="how-heading" className="border-y border-border bg-surface-2">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 id="how-heading" className="text-3xl font-bold">
            How it works
          </h2>
          <ol className="mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
            {steps.map((step, index) => (
              <li key={step.title} className="flex flex-col gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-primary font-display text-lg font-bold text-on-primary">
                  {index + 1}
                </span>
                <h3 className="text-xl font-bold">{step.title}</h3>
                <p className="text-ink-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-12 text-on-primary sm:px-12">
          <ImigongoPattern className="absolute inset-y-0 right-0 w-1/3 text-on-primary opacity-15" />
          <div className="relative flex max-w-xl flex-col items-start gap-4">
            <h2 className="text-3xl font-bold">Own a small business?</h2>
            <p className="text-lg">
              List it for free. Customers who search for what you offer will find you, and reach you
              directly.
            </p>
            <ButtonLink href="/list-your-business" variant="secondary" size="lg">
              List your business <ArrowRight aria-hidden />
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
