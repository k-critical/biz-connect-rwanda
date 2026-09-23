import "server-only";
import { categories, type CategorySlug } from "@/config/categories";
import type { BusinessCardData } from "@/components/business/business-card";
import type { ExploreFilters } from "@/lib/explore-params";
import { formatRwf, priceLevelLabel } from "@/lib/format";
import { getOpenStatus, kigaliClock, weeklySchedule } from "@/lib/opening-hours";
import {
  countPublishedByCategory,
  findFeaturedBusinesses,
  findPublishedBusinessBySlug,
  findPublishedBusinesses,
  findSimilarBusinesses,
  getDirectoryCounts,
  listProvincesWithDistricts,
  listPublishedSlugs,
  searchPublishedBusinessIds,
  type BusinessCardRow,
} from "@/server/repositories/business-repository";

export const PAGE_SIZE = 12;

const categorySlugs = new Set<string>(categories.map((c) => c.slug));

function toCategorySlug(slug: string | undefined): CategorySlug {
  return slug && categorySlugs.has(slug) ? (slug as CategorySlug) : "others";
}

function toCard(row: BusinessCardRow, now: Date): BusinessCardData {
  const status = getOpenStatus(row.openingHours, now);
  return {
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    categorySlug: toCategorySlug(row.categories[0]?.category.slug),
    location: [row.sector, row.district.name].filter(Boolean).join(", "),
    isOpenNow: status.state === "unknown" ? null : status.state === "open",
    whatsappNumber: row.whatsapp,
  };
}

export async function searchDirectory(filters: ExploreFilters, now = new Date()) {
  const ids = filters.q ? await searchPublishedBusinessIds(filters.q) : undefined;
  if (ids?.length === 0) return { items: [], total: 0, pageCount: 0 };

  const { items, total } = await findPublishedBusinesses({
    ids,
    category: filters.category,
    district: filters.district,
    priceLevel: filters.priceLevel,
    openAt: filters.openNow ? kigaliClock(now) : undefined,
    sort: filters.sort,
    page: filters.page,
    pageSize: PAGE_SIZE,
  });
  return {
    items: items.map((row) => toCard(row, now)),
    total,
    pageCount: Math.ceil(total / PAGE_SIZE),
  };
}

export async function getHomePageData(now = new Date()) {
  const [featured, categoryCounts, counts] = await Promise.all([
    findFeaturedBusinesses(6),
    countPublishedByCategory(),
    getDirectoryCounts(),
  ]);
  return {
    featured: featured.map((row) => toCard(row, now)),
    categories: categories.map((c) => ({ ...c, count: categoryCounts.get(c.slug) ?? 0 })),
    stats: { ...counts, categories: categories.length },
  };
}

export async function getDistrictOptions() {
  return listProvincesWithDistricts();
}

export async function getSitemapBusinesses() {
  return listPublishedSlugs();
}

export async function getBusinessProfile(slug: string, now = new Date()) {
  const b = await findPublishedBusinessBySlug(slug);
  if (!b) return null;

  const primaryCategory = b.categories[0]?.category;
  const [sameCategory, sameDistrict] = await Promise.all([
    primaryCategory
      ? findSimilarBusinesses({ excludeId: b.id, categoryId: primaryCategory.id, limit: 3 })
      : Promise.resolve([]),
    findSimilarBusinesses({ excludeId: b.id, districtId: b.districtId, limit: 6 }),
  ]);
  const relatedIds = new Set(sameCategory.map((r) => r.id));

  return {
    business: {
      slug: b.slug,
      name: b.name,
      tagline: b.tagline,
      description: b.description,
      sector: b.sector,
      address: b.address,
      district: { slug: b.district.slug, name: b.district.name },
      province: b.district.province.name,
      categories: b.categories.map((c) => ({
        slug: toCategorySlug(c.category.slug),
        name: c.category.name,
      })),
      priceLabel: priceLevelLabel(b.priceLevel),
      contact: {
        whatsapp: b.whatsapp,
        phone: b.phone,
        email: b.email,
        website: b.website,
        facebookUrl: b.facebookUrl,
        instagramUrl: b.instagramUrl,
      },
      hours: b.openingHours,
      status: getOpenStatus(b.openingHours, now),
      schedule: weeklySchedule(b.openingHours),
      today: kigaliClock(now).day,
      showcase: b.showcaseSections.map((section) => ({
        title: section.title,
        items: section.items.map((item) => ({
          name: item.name,
          description: item.description,
          price: item.priceRwf === null ? null : formatRwf(item.priceRwf),
        })),
      })),
      latitude: b.latitude === null ? null : Number(b.latitude),
      longitude: b.longitude === null ? null : Number(b.longitude),
    },
    related: sameCategory.map((row) => toCard(row, now)),
    nearby: sameDistrict
      .filter((row) => !relatedIds.has(row.id))
      .slice(0, 3)
      .map((row) => toCard(row, now)),
  };
}

export type BusinessProfile = NonNullable<Awaited<ReturnType<typeof getBusinessProfile>>>;
