import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import type { CategorySlug } from "@/config/categories";
import { photoSrc } from "@/lib/media";
import type { ContactDefaults } from "@/components/owner/contact-form";
import type { DetailsDefaults } from "@/components/owner/details-form";
import type { ManagedPhoto } from "@/components/owner/photo-manager";
import type { ShowcaseDefaults } from "@/components/owner/showcase-form";
import { requireUser } from "@/server/auth/session";
import { getOwnedListing, type OwnedBusiness } from "@/server/services/listing-service";

/**
 * The signed-in owner and one of their listings, loaded once per request and shared by the
 * layout and page. Someone else's listing answers "not found".
 */
export const loadOwnedListing = cache(async (id: string) => {
  const user = await requireUser(`/dashboard/${id}`);
  const business = await getOwnedListing(user.id, id);
  if (!business) notFound();
  return { user, business };
});

export function detailsDefaults(b: OwnedBusiness): DetailsDefaults {
  return {
    name: b.name,
    tagline: b.tagline,
    description: b.description,
    category: b.categories[0]?.category.slug ?? "",
    extraCategories: b.categories.slice(1).map((c) => c.category.slug),
    district: b.district.slug,
    priceLevel: b.priceLevel,
  };
}

export function contactDefaults(b: OwnedBusiness): ContactDefaults {
  return {
    sector: b.sector,
    address: b.address,
    latitude: b.latitude === null ? null : Number(b.latitude),
    longitude: b.longitude === null ? null : Number(b.longitude),
    whatsapp: b.whatsapp,
    phone: b.phone,
    email: b.email,
    website: b.website,
    facebookUrl: b.facebookUrl,
    instagramUrl: b.instagramUrl,
  };
}

export function managedPhotos(b: OwnedBusiness): ManagedPhoto[] {
  return b.photos.map((photo) => ({
    id: photo.id,
    src: photoSrc(photo.storageKey),
    blurDataUrl: photo.blurDataUrl,
    alt: photo.altText,
  }));
}

export function showcaseDefaults(b: OwnedBusiness): ShowcaseDefaults {
  return b.showcaseSections.map((section) => ({
    title: section.title,
    items: section.items.map((item) => ({
      name: item.name,
      description: item.description,
      priceRwf: item.priceRwf,
    })),
  }));
}

const SHOWCASE_EXAMPLES: Record<CategorySlug, string> = {
  restaurants: "“Food”, “Drinks” or “Breakfast”",
  hotels: "“Rooms”, “Meals” or “Conference hall”",
  shops: "“New arrivals”, “Best sellers” or “Phones”",
  services: "“Services”, “Packages” or “Repairs”",
  beauty: "“Hair”, “Nails” or “Make-up”",
  entertainment: "“Events”, “Tickets” or “Packages”",
  cinema: "“Tickets”, “Snacks” or “This week”",
  transport: "“Routes”, “Vehicles” or “Prices”",
  others: "“Products”, “Services” or “Prices”",
};

export function showcaseExamples(b: OwnedBusiness): string {
  const slug = (b.categories[0]?.category.slug ?? "others") as CategorySlug;
  return SHOWCASE_EXAMPLES[slug] ?? SHOWCASE_EXAMPLES.others;
}
