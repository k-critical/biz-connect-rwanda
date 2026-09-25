import Link from "next/link";
import { ExternalLink, MapPin, Tag } from "lucide-react";
import type { BusinessProfileData } from "@/server/services/directory-service";
import type { BusinessCardData } from "@/components/business/business-card";
import { cn } from "@/lib/cn";
import { ImigongoPattern } from "@/components/brand/imigongo-pattern";
import { BusinessGrid } from "@/components/business/business-grid";
import { CategoryIcon } from "@/components/category-icon";
import { BusinessMap } from "@/components/map/business-map";
import { googleMapsUrl, openStreetMapUrl } from "@/lib/map-links";
import { ContactCard } from "./contact-card";
import { MobileContactBar } from "./mobile-contact-bar";
import { OpeningHoursTable } from "./opening-hours-table";
import { PhotoGallery } from "./photo-gallery";
import { ShareButton } from "./share-button";
import { Showcase } from "./showcase";
import { Badge } from "@/components/ui/badge";

const statusDot = {
  open: "bg-success",
  closed: "bg-danger",
  unknown: "bg-ink-subtle",
} as const;

/**
 * A business profile. Used by the public page (/b/[slug]) and by the owner's preview, which
 * passes `preview` to hide sharing, claiming and suggestions.
 */
export function BusinessProfileView({
  business: b,
  related = [],
  nearby = [],
  preview = false,
}: {
  business: BusinessProfileData;
  related?: BusinessCardData[];
  nearby?: BusinessCardData[];
  preview?: boolean;
}) {
  const primary = b.categories[0];
  const place = [b.sector, b.district.name, b.province].filter(Boolean).join(", ");
  const hasMobileBar = !preview && Boolean(b.contact.whatsapp || b.contact.phone);
  const hasPin = b.latitude !== null && b.longitude !== null;

  return (
    <div className={cn(hasMobileBar && "pb-24 md:pb-0")}>
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

          {b.photos.length > 0 && (
            <div className="mt-6">
              <PhotoGallery photos={b.photos} name={b.name} />
            </div>
          )}

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

            {!preview && (
              <div className="md:self-start">
                <ShareButton title={b.name} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_22rem]">
        <div className="flex min-w-0 flex-col gap-12">
          <section aria-labelledby="about-heading">
            <h2 id="about-heading" className="text-2xl font-bold">
              About
            </h2>
            <p className="mt-3 max-w-prose leading-relaxed whitespace-pre-line text-ink">
              {b.description}
            </p>
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

          {(hasPin || b.address) && (
            <section aria-labelledby="location-heading">
              <h2 id="location-heading" className="text-2xl font-bold">
                How to find it
              </h2>
              <p className="mt-1 text-ink-muted">
                {[b.address, place].filter(Boolean).join(" · ")}
              </p>
              {hasPin && (
                <>
                  <div className="mt-4">
                    <BusinessMap latitude={b.latitude!} longitude={b.longitude!} name={b.name} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
                    <a
                      href={googleMapsUrl(b.latitude!, b.longitude!)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-primary hover:underline"
                    >
                      Directions in Google Maps <ExternalLink className="size-4" aria-hidden />
                    </a>
                    <a
                      href={openStreetMapUrl(b.latitude!, b.longitude!)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-primary hover:underline"
                    >
                      Open in OpenStreetMap <ExternalLink className="size-4" aria-hidden />
                    </a>
                  </div>
                </>
              )}
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <ContactCard name={b.name} contact={b.contact} />
          {!preview && b.isClaimable && (
            <div className="rounded-2xl border border-dashed border-border-strong p-5 text-sm">
              <p className="font-semibold text-ink">Is this your business?</p>
              <p className="mt-1 text-ink-muted">
                Ask to manage this listing so you can keep the hours, photos and prices up to date.
              </p>
              <Link
                href={`/b/${b.slug}/claim`}
                className="mt-3 inline-block font-semibold text-primary hover:underline"
              >
                Claim this listing
              </Link>
            </div>
          )}
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

      {hasMobileBar && <MobileContactBar contact={b.contact} />}
    </div>
  );
}
