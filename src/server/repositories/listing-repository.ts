import "server-only";
import type { BusinessStatus, Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";
import { businessProfileInclude } from "./business-repository";

/** Listings as their owner manages them. Every query is limited to the owner's own rows. */

export async function countOwnedBusinesses(ownerId: string) {
  return db.business.count({ where: { ownerId } });
}

export async function listOwnedBusinesses(ownerId: string) {
  return db.business.findMany({
    where: { ownerId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      slug: true,
      name: true,
      tagline: true,
      status: true,
      submittedAt: true,
      updatedAt: true,
      district: { select: { name: true } },
      categories: { where: { position: 0 }, select: { category: { select: { slug: true } } } },
      photos: {
        orderBy: { position: "asc" },
        take: 1,
        select: { storageKey: true, blurDataUrl: true, altText: true },
      },
    },
  });
}

export type OwnedBusinessSummary = Awaited<ReturnType<typeof listOwnedBusinesses>>[number];

export async function findOwnedBusiness(id: string, ownerId: string) {
  return db.business.findFirst({ where: { id, ownerId }, include: businessProfileInclude });
}

export type OwnedBusiness = NonNullable<Awaited<ReturnType<typeof findOwnedBusiness>>>;

export async function isSlugTaken(slug: string, exceptId?: string) {
  const found = await db.business.findFirst({
    where: { slug, ...(exceptId && { id: { not: exceptId } }) },
    select: { id: true },
  });
  return found !== null;
}

export async function findDistrictBySlug(slug: string) {
  return db.district.findUnique({ where: { slug }, select: { id: true, name: true } });
}

export async function findCategoryIds(slugs: string[]) {
  const rows = await db.category.findMany({
    where: { slug: { in: slugs } },
    select: { id: true, slug: true },
  });
  const bySlug = new Map(rows.map((row) => [row.slug, row.id]));
  return slugs.map((slug) => bySlug.get(slug));
}

type DetailsData = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  priceLevel: number | null;
  districtId: number;
};

const categoryRows = (categoryIds: number[]) =>
  categoryIds.map((categoryId, position) => ({ categoryId, position }));

/** Creates a draft and makes its creator an owner (admins keep their role). */
export async function createDraftBusiness(
  ownerId: string,
  data: DetailsData,
  categoryIds: number[],
) {
  const [business] = await db.$transaction([
    db.business.create({
      data: {
        ...data,
        ownerId,
        status: "DRAFT",
        categories: { create: categoryRows(categoryIds) },
      },
      select: { id: true },
    }),
    db.user.updateMany({ where: { id: ownerId, role: "VISITOR" }, data: { role: "OWNER" } }),
  ]);
  return business;
}

export async function updateBusinessDetails(id: string, data: DetailsData, categoryIds: number[]) {
  await db.$transaction([
    db.businessCategory.deleteMany({ where: { businessId: id } }),
    db.business.update({
      where: { id },
      data: { ...data, categories: { create: categoryRows(categoryIds) } },
    }),
  ]);
}

export async function updateBusinessContact(id: string, data: Prisma.BusinessUpdateInput) {
  await db.business.update({ where: { id }, data });
}

export async function replaceOpeningHours(
  id: string,
  periods: { dayOfWeek: number; opensAt: number; closesAt: number }[],
) {
  await db.$transaction([
    db.openingHours.deleteMany({ where: { businessId: id } }),
    db.openingHours.createMany({ data: periods.map((p) => ({ ...p, businessId: id })) }),
    // Touch the listing so "last updated" reflects the change.
    db.business.update({ where: { id }, data: { updatedAt: new Date() } }),
  ]);
}

export async function replaceShowcase(
  id: string,
  sections: {
    title: string;
    items: { name: string; description: string | null; priceRwf: number | null }[];
  }[],
) {
  await db.$transaction([
    db.showcaseSection.deleteMany({ where: { businessId: id } }),
    ...sections.map((section, position) =>
      db.showcaseSection.create({
        data: {
          businessId: id,
          title: section.title,
          position,
          items: { create: section.items.map((item, index) => ({ ...item, position: index })) },
        },
      }),
    ),
    db.business.update({ where: { id }, data: { updatedAt: new Date() } }),
  ]);
}

export async function setBusinessStatus(
  id: string,
  status: BusinessStatus,
  extra: { submittedAt?: Date } = {},
) {
  await db.business.update({ where: { id }, data: { status, ...extra } });
}

export async function deleteBusiness(id: string) {
  await db.business.delete({ where: { id } });
}

// Photos --------------------------------------------------------------------------------------

export async function countPhotos(businessId: string) {
  return db.photo.count({ where: { businessId } });
}

export async function createPhoto(data: {
  businessId: string;
  storageKey: string;
  width: number;
  height: number;
  blurDataUrl: string;
  altText: string;
}) {
  return db.$transaction(async (tx) => {
    const last = await tx.photo.findFirst({
      where: { businessId: data.businessId },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    return tx.photo.create({
      data: { ...data, position: last ? last.position + 1 : 0 },
      select: { id: true },
    });
  });
}

export async function listPhotoKeys(businessId: string) {
  const rows = await db.photo.findMany({ where: { businessId }, select: { storageKey: true } });
  return rows.map((row) => row.storageKey);
}

export async function updatePhotoAltText(businessId: string, photoId: string, altText: string) {
  const result = await db.photo.updateMany({
    where: { id: photoId, businessId },
    data: { altText },
  });
  return result.count > 0;
}

/** Saves a new order; `photoIds` must be exactly the business's photos. */
export async function setPhotoOrder(businessId: string, photoIds: string[]) {
  await db.$transaction(
    photoIds.map((id, position) =>
      db.photo.updateMany({ where: { id, businessId }, data: { position } }),
    ),
  );
}

export async function deletePhoto(businessId: string, photoId: string) {
  return db.$transaction(async (tx) => {
    const photo = await tx.photo.findFirst({
      where: { id: photoId, businessId },
      select: { storageKey: true },
    });
    if (!photo) return null;
    await tx.photo.delete({ where: { id: photoId } });
    const rest = await tx.photo.findMany({
      where: { businessId },
      orderBy: { position: "asc" },
      select: { id: true },
    });
    for (const [position, { id }] of rest.entries()) {
      await tx.photo.update({ where: { id }, data: { position } });
    }
    return photo.storageKey;
  });
}
