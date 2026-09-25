import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";
import { previousDay } from "@/lib/opening-hours";

const PUBLISHED = { status: "APPROVED" } as const satisfies Prisma.BusinessWhereInput;

export const businessCardSelect = {
  id: true,
  slug: true,
  name: true,
  tagline: true,
  sector: true,
  whatsapp: true,
  district: { select: { name: true } },
  categories: { where: { position: 0 }, select: { category: { select: { slug: true } } } },
  openingHours: { select: { dayOfWeek: true, opensAt: true, closesAt: true } },
  photos: {
    orderBy: { position: "asc" },
    take: 1,
    select: { storageKey: true, blurDataUrl: true, altText: true },
  },
} as const satisfies Prisma.BusinessSelect;

/** Everything a profile page shows. Used for public profiles and the owner's preview. */
export const businessProfileInclude = {
  district: { include: { province: true } },
  categories: { orderBy: { position: "asc" }, include: { category: true } },
  openingHours: { orderBy: [{ dayOfWeek: "asc" }, { opensAt: "asc" }] },
  photos: { orderBy: { position: "asc" } },
  showcaseSections: {
    orderBy: { position: "asc" },
    include: { items: { orderBy: { position: "asc" } } },
  },
} as const satisfies Prisma.BusinessInclude;

export type BusinessProfileRow = Prisma.BusinessGetPayload<{
  include: typeof businessProfileInclude;
}>;

export type BusinessCardRow = Prisma.BusinessGetPayload<{ select: typeof businessCardSelect }>;

export type ListingQuery = {
  ids?: string[];
  category?: string;
  district?: string;
  priceLevel?: number;
  openAt?: { day: number; minutes: number };
  sort: "relevance" | "recommended" | "name" | "newest";
  page: number;
  pageSize: number;
};

// Mirrors isOpenAt() in src/lib/opening-hours.ts; the directory tests check they agree.
function openAtWhere({ day, minutes }: { day: number; minutes: number }) {
  const opensAt = db.openingHours.fields.opensAt;
  return {
    openingHours: {
      some: {
        OR: [
          { dayOfWeek: day, opensAt: { lte: minutes }, closesAt: { gt: minutes } },
          { dayOfWeek: day, opensAt: { lte: minutes }, closesAt: { lte: opensAt } },
          { dayOfWeek: previousDay(day), closesAt: { gt: minutes, lte: opensAt } },
        ],
      },
    },
  } satisfies Prisma.BusinessWhereInput;
}

const sortOrder: Record<
  Exclude<ListingQuery["sort"], "relevance">,
  Prisma.BusinessOrderByWithRelationInput[]
> = {
  recommended: [{ isFeatured: "desc" }, { name: "asc" }],
  name: [{ name: "asc" }],
  newest: [{ createdAt: "desc" }, { name: "asc" }],
};

export async function findPublishedBusinesses(query: ListingQuery) {
  const where: Prisma.BusinessWhereInput = {
    ...PUBLISHED,
    ...(query.ids && { id: { in: query.ids } }),
    ...(query.category && { categories: { some: { category: { slug: query.category } } } }),
    ...(query.district && { district: { slug: query.district } }),
    ...(query.priceLevel && { priceLevel: query.priceLevel }),
    ...(query.openAt && openAtWhere(query.openAt)),
  };
  const skip = (query.page - 1) * query.pageSize;

  if (query.sort === "relevance" && query.ids) {
    const rank = new Map(query.ids.map((id, index) => [id, index]));
    const matches = await db.business.findMany({ where, select: businessCardSelect });
    matches.sort((a, b) => rank.get(a.id)! - rank.get(b.id)!);
    return { items: matches.slice(skip, skip + query.pageSize), total: matches.length };
  }

  const orderBy = sortOrder[query.sort === "relevance" ? "recommended" : query.sort];
  const [items, total] = await Promise.all([
    db.business.findMany({
      where,
      select: businessCardSelect,
      orderBy,
      skip,
      take: query.pageSize,
    }),
    db.business.count({ where }),
  ]);
  return { items, total };
}

/**
 * Ids of published businesses matching a free-text search, best match first. Combines
 * full-text search over the name, description, place and categories with typo-tolerant
 * trigram matching on the name.
 */
export async function searchPublishedBusinessIds(text: string, limit = 200): Promise<string[]> {
  const likePattern = `%${text.replace(/[\\%_]/g, "\\$&")}%`;
  const rows = await db.$queryRaw<{ id: string }[]>`
    WITH docs AS (
      SELECT b.id, b.name,
        to_tsvector('english', concat_ws(' ', b.name, b.tagline, b.description, b.sector, d.name,
          (SELECT string_agg(c.name, ' ')
             FROM business_categories bc JOIN categories c ON c.id = bc.category_id
            WHERE bc.business_id = b.id))) AS doc
      FROM businesses b
      JOIN districts d ON d.id = b.district_id
      WHERE b.status = 'APPROVED'
    )
    SELECT docs.id
      FROM docs, websearch_to_tsquery('english', ${text}) AS query
     WHERE docs.doc @@ query
        OR docs.name ILIKE ${likePattern}
        OR word_similarity(${text}, docs.name) >= 0.4
     ORDER BY ts_rank(docs.doc, query) + word_similarity(${text}, docs.name) DESC, docs.name
     LIMIT ${limit}`;
  return rows.map((row) => row.id);
}

export async function findFeaturedBusinesses(limit: number) {
  return db.business.findMany({
    where: { ...PUBLISHED, isFeatured: true },
    select: businessCardSelect,
    orderBy: { name: "asc" },
    take: limit,
  });
}

export async function findPublishedBusinessBySlug(slug: string) {
  return db.business.findFirst({
    where: { ...PUBLISHED, slug },
    include: businessProfileInclude,
  });
}

export async function findSimilarBusinesses(options: {
  excludeId: string;
  categoryId?: number;
  districtId?: number;
  limit: number;
}) {
  return db.business.findMany({
    where: {
      ...PUBLISHED,
      id: { not: options.excludeId },
      ...(options.categoryId && {
        categories: { some: { categoryId: options.categoryId, position: 0 } },
      }),
      ...(options.districtId && { districtId: options.districtId }),
    },
    select: businessCardSelect,
    orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
    take: options.limit,
  });
}

export async function countPublishedByCategory() {
  const rows = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      slug: true,
      _count: { select: { businesses: { where: { business: PUBLISHED } } } },
    },
  });
  return new Map(rows.map((row) => [row.slug, row._count.businesses]));
}

export async function listProvincesWithDistricts() {
  return db.province.findMany({
    orderBy: { id: "asc" },
    select: {
      name: true,
      districts: { orderBy: { name: "asc" }, select: { slug: true, name: true } },
    },
  });
}

export async function getDirectoryCounts() {
  const [businesses, districts] = await Promise.all([
    db.business.count({ where: PUBLISHED }),
    db.business.groupBy({ by: ["districtId"], where: PUBLISHED }),
  ]);
  return { businesses, districts: districts.length };
}

export async function listPublishedSlugs() {
  return db.business.findMany({
    where: PUBLISHED,
    select: { slug: true, updatedAt: true },
    orderBy: { slug: "asc" },
  });
}
