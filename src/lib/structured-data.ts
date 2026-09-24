import type { CategorySlug } from "@/config/categories";
import { DAY_NAMES, formatTime, type HoursPeriod } from "./opening-hours";

const schemaTypes: Record<CategorySlug, string> = {
  restaurants: "Restaurant",
  hotels: "LodgingBusiness",
  shops: "Store",
  services: "ProfessionalService",
  beauty: "BeautySalon",
  entertainment: "EntertainmentBusiness",
  cinema: "MovieTheater",
  transport: "LocalBusiness",
  others: "LocalBusiness",
};

export type StructuredBusiness = {
  name: string;
  description: string;
  url: string;
  categorySlug: CategorySlug;
  sector: string | null;
  address: string | null;
  district: string;
  phone: string | null;
  priceLabel: string | null;
  hours: HoursPeriod[];
  latitude: number | null;
  longitude: number | null;
};

/** schema.org LocalBusiness data, so search engines can show hours, area and type. */
export function localBusinessJsonLd(b: StructuredBusiness) {
  return {
    "@context": "https://schema.org",
    "@type": schemaTypes[b.categorySlug],
    name: b.name,
    description: b.description,
    url: b.url,
    ...(b.phone && { telephone: b.phone }),
    ...(b.priceLabel && { priceRange: b.priceLabel }),
    address: {
      "@type": "PostalAddress",
      ...(b.address && { streetAddress: b.address }),
      ...(b.sector && { addressLocality: b.sector }),
      addressRegion: b.district,
      addressCountry: "RW",
    },
    ...(b.latitude !== null &&
      b.longitude !== null && {
        geo: { "@type": "GeoCoordinates", latitude: b.latitude, longitude: b.longitude },
      }),
    openingHoursSpecification: b.hours.map((p) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: DAY_NAMES[p.dayOfWeek - 1],
      opens: formatTime(p.opensAt),
      closes: p.closesAt === 24 * 60 ? "23:59" : formatTime(p.closesAt),
    })),
  };
}

/** Serialises JSON-LD for a <script> tag without letting "</script>" break out of it. */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
