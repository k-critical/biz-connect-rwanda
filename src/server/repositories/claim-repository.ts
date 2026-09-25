import "server-only";
import { db } from "@/server/db";

export async function findBusinessForClaim(slug: string) {
  return db.business.findFirst({
    where: { slug, status: "APPROVED" },
    select: {
      id: true,
      slug: true,
      name: true,
      ownerId: true,
      district: { select: { name: true } },
    },
  });
}

export async function findPendingClaim(businessId: string, userId: string) {
  return db.claimRequest.findFirst({
    where: { businessId, userId, status: "PENDING" },
    select: { id: true, createdAt: true },
  });
}

export async function countPendingClaimsByUser(userId: string) {
  return db.claimRequest.count({ where: { userId, status: "PENDING" } });
}

export async function createClaim(data: {
  businessId: string;
  userId: string;
  relationship: string;
  contactPhone: string;
  message: string;
  evidenceKey: string | null;
  evidenceType: string | null;
}) {
  return db.claimRequest.create({ data, select: { id: true } });
}

export async function listClaimsByUser(userId: string) {
  return db.claimRequest.findMany({
    where: { userId, status: { not: "WITHDRAWN" } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      createdAt: true,
      decisionNote: true,
      business: { select: { name: true, slug: true } },
    },
  });
}

/** Withdraws a pending claim; returns its evidence file key (to delete) or null. */
export async function withdrawClaim(id: string, userId: string) {
  return db.$transaction(async (tx) => {
    const claim = await tx.claimRequest.findFirst({
      where: { id, userId, status: "PENDING" },
      select: { evidenceKey: true },
    });
    if (!claim) return { found: false as const };
    await tx.claimRequest.update({
      where: { id },
      data: { status: "WITHDRAWN", evidenceKey: null, evidenceType: null },
    });
    return { found: true as const, evidenceKey: claim.evidenceKey };
  });
}
