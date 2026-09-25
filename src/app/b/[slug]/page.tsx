import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { env } from "@/config/env";
import { getBusinessProfile } from "@/server/services/directory-service";
import { jsonLdScript, localBusinessJsonLd } from "@/lib/structured-data";
import { BusinessProfileView } from "@/components/profile/business-profile-view";
import { Alert } from "@/components/ui/alert";

// Open/closed status depends on the current time, so this page is rendered per request.
export const dynamic = "force-dynamic";

const loadProfile = cache((slug: string) => getBusinessProfile(slug));

const absolute = (path: string) => new URL(path, env.NEXT_PUBLIC_SITE_URL).toString();

export async function generateMetadata({ params }: PageProps<"/b/[slug]">): Promise<Metadata> {
  const profile = await loadProfile((await params).slug);
  if (!profile) return { title: "Business not found" };
  const { business } = profile;
  const cover = business.photos[0];
  return {
    title: `${business.name}, ${business.district.name}`,
    description: business.tagline,
    alternates: { canonical: `/b/${business.slug}` },
    openGraph: {
      type: "website",
      title: business.name,
      description: business.tagline,
      url: `/b/${business.slug}`,
      ...(cover && {
        images: [
          { url: `${cover.src}-lg.webp`, width: cover.width, height: cover.height, alt: cover.alt },
        ],
      }),
    },
  };
}

export default async function BusinessPage({ params, searchParams }: PageProps<"/b/[slug]">) {
  const [profile, query] = await Promise.all([loadProfile((await params).slug), searchParams]);
  if (!profile) notFound();

  const { business: b, related, nearby } = profile;
  const jsonLd = localBusinessJsonLd({
    name: b.name,
    description: b.description,
    url: absolute(`/b/${b.slug}`),
    categorySlug: b.categories[0]?.slug ?? "others",
    sector: b.sector,
    address: b.address,
    district: b.district.name,
    phone: b.contact.phone,
    priceLabel: b.priceLabel,
    hours: b.hours,
    latitude: b.latitude,
    longitude: b.longitude,
    images: b.photos.map((photo) => absolute(`${photo.src}-lg.webp`)),
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }}
      />
      {query.reported && (
        <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
          <Alert tone="success">Thank you. An admin will look at your report.</Alert>
        </div>
      )}
      <BusinessProfileView business={b} related={related} nearby={nearby} />
    </>
  );
}
