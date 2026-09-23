import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { MapPin, Tag } from "lucide-react";
import { env } from "@/config/env";
import { getBusinessProfile } from "@/server/services/directory-service";
import { jsonLdScript, localBusinessJsonLd } from "@/lib/structured-data";
import { cn } from "@/lib/cn";
import { ImigongoPattern } from "@/components/brand/imigongo-pattern";
import { BusinessGrid } from "@/components/business/business-grid";
import { CategoryIcon } from "@/components/category-icon";
import { ContactCard } from "@/components/profile/contact-card";
import { MobileContactBar } from "@/components/profile/mobile-contact-bar";
import { OpeningHoursTable } from "@/components/profile/opening-hours-table";
import { ShareButton } from "@/components/profile/share-button";
import { Showcase } from "@/components/profile/showcase";
import { Badge } from "@/components/ui/badge";

// Open/closed status depends on the current time, so this page is rendered per request.
export const dynamic = "force-dynamic";

const loadProfile = cache((slug: string) => getBusinessProfile(slug));

export async function generateMetadata({ params }: PageProps<"/b/[slug]">): Promise<Metadata> {
  const profile = await loadProfile((await params).slug);
  if (!profile) return { title: "Business not found" };
  const { business } = profile;
  return {
    title: `${business.name}, ${business.district.name}`,
    description: business.tagline,
    alternates: { canonical: `/b/${business.slug}` },
    openGraph: {
      type: "website",
      title: business.name,
      description: business.tagline,
      url: `/b/${business.slug}`,
    },
  };
}

const statusDot = {
  open: "bg-success",
  closed: "bg-danger",
  unknown: "bg-ink-subtle",
} as const;

export default async function BusinessPage({ params }: PageProps<"/b/[slug]">) {
  const profile = await loadProfile((await params).slug);
  if (!profile) notFound();

  const { business: b, related, nearby } = profile;
  const primary = b.categories[0];
  const place = [b.sector, b.district.name, b.province].filter(Boolean).join(", ");
  const hasMobileBar = Boolean(b.contact.whatsapp || b.contact.phone);

  const jsonLd = localBusinessJsonLd({
    name: b.name,
    description: b.description,
    url: new URL(`/b/${b.slug}`, env.NEXT_PUBLIC_SITE_URL).toString(),
    categorySlug: primary?.slug ?? "others",
    sector: b.sector,
    address: b.address,
    district: b.district.name,
    phone: b.contact.phone,
    priceLabel: b.priceLabel,
    hours: b.hours,
    latitude: b.latitude,
    longitude: b.longitude,
  });

  return (
    <div className={cn(hasMobileBar && "pb-24 md:pb-0")}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }}
      />

      <div className="border-b border-border bg-surface-2">
        <div className="mx-auto max-w-6xl px-4 pt-6 pb-10 sm:px-6">
          <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li>
                <Link href="/" className="hover:text-primary">
                  Home
                </Link>
              </li>
              <li aria-hidden>/</li>
              {primary && (
                <>
                  <li>
                    <Link href={`/c/${primary.slug}`} className="hover:text-primary">
                      {primary.name}
                    </Link>
                  </li>
                  <li aria-hidden>/</li>
                </>
              )}
              <li aria-current="page" className="font-semibold text-ink">
                {b.name}
              </li>
            </ol>
          </nav>

          <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-end">
            <div className="relative flex aspect-square w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-surface text-border shadow-card md:w-36">
              <ImigongoPattern className="absolute inset-0 opacity-60" />
              <span className="relative flex size-14 items-center justify-center rounded-full bg-surface text-primary shadow-card">
                <CategoryIcon slug={primary?.slug ?? "others"} className="size-7" />
              </span>
            </div>

            <div className="flex flex-1 flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                {b.categories.map((c) => (
                  <Link key={c.slug} href={`/c/${c.slug}`}>
                    <Badge>{c.name}</Badge>
                  </Link>
                ))}
              </div>
              <h1 className="text-3xl font-bold sm:text-4xl">{b.name}</h1>
              <p className="max-w-2xl text-lg text-ink-muted">{b.tagline}</p>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                <span className="inline-flex items-center gap-2 font-semibold text-ink">
                  <span
                    className={cn("size-2.5 rounded-full", statusDot[b.status.state])}
                    aria-hidden
                  />
                  {b.status.label}
                </span>
                <span className="inline-flex items-center gap-1.5 text-ink-muted">
                  <MapPin className="size-4" aria-hidden />
                  {place}
                </span>
                {b.priceLabel && (
                  <span className="inline-flex items-center gap-1.5 text-ink-muted">
                    <Tag className="size-4" aria-hidden />
                    {b.priceLabel}
                  </span>
                )}
              </div>
            </div>

            <div className="md:self-start">
              <ShareButton title={b.name} />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_22rem]">
        <div className="flex min-w-0 flex-col gap-12">
          <section aria-labelledby="about-heading">
            <h2 id="about-heading" className="text-2xl font-bold">
              About
            </h2>
            <p className="mt-3 max-w-prose leading-relaxed text-ink">{b.description}</p>
            {b.address && <p className="mt-3 text-sm text-ink-muted">{b.address}</p>}
          </section>

          {b.showcase.length > 0 && (
            <section aria-labelledby="offer-heading">
              <h2 id="offer-heading" className="text-2xl font-bold">
                What&apos;s on offer
              </h2>
              <div className="mt-4">
                <Showcase sections={b.showcase} />
              </div>
            </section>
          )}

          <section aria-labelledby="hours-heading">
            <h2 id="hours-heading" className="text-2xl font-bold">
              Opening hours
            </h2>
            <p className="mt-1 text-sm text-ink-muted">Kigali time</p>
            <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
              <OpeningHoursTable schedule={b.schedule} today={b.today} />
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <ContactCard name={b.name} contact={b.contact} />
        </aside>
      </div>

      {related.length > 0 && primary && (
        <section aria-labelledby="related-heading" className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <h2 id="related-heading" className="text-2xl font-bold">
            More {primary.name.toLowerCase()}
          </h2>
          <div className="mt-5">
            <BusinessGrid businesses={related} />
          </div>
        </section>
      )}

      {nearby.length > 0 && (
        <section aria-labelledby="nearby-heading" className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <h2 id="nearby-heading" className="text-2xl font-bold">
            Also in {b.district.name}
          </h2>
          <div className="mt-5">
            <BusinessGrid businesses={nearby} />
          </div>
        </section>
      )}

      <MobileContactBar contact={b.contact} />
    </div>
  );
}
