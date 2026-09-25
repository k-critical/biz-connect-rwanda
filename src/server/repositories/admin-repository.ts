import "server-only";
import type {
  BusinessStatus,
  ClaimStatus,
  Prisma,
  ReportReason,
  ReportStatus,
} from "@/generated/prisma/client";
import { db } from "@/server/db";
import { businessProfileInclude } from "./business-repository";

/**
 * Admin reads and decisions. Every decision changes the row only if it's still in the state
 * the admin saw (so two admins can't both act on it), and writes its audit entry in the same
 * transaction: either both happen or neither does.
 */

export type AuditEntry = {
  actorId: string;
  action: string;
  targetType: "business" | "claim" | "report";
  targetId: string;
  summary: string;
  details?: Prisma.InputJsonValue;
};

const skip = (page: number, pageSize: number) => (page - 1) * pageSize;

export async function getAdminCounts() {
  const [pendingListings, pendingClaims, openReports, liveListings] = await Promise.all([
    db.business.count({ where: { status: "PENDING" } }),
    db.claimRequest.count({ where: { status: "PENDING" } }),
    db.report.count({ where: { status: "OPEN" } }),
    db.business.count({ where: { status: "APPROVED" } }),
  ]);
  return { pendingListings, pendingClaims, openReports, liveListings };
}

// Listings -------------------------------------------------------------------------------------

export async function listListingsForAdmin(options: {
  status: BusinessStatus;
  query?: string;
  page: number;
  pageSize: number;
}) {
  const where: Prisma.BusinessWhereInput = {
    status: options.status,
    ...(options.query && {
      OR: [
        { name: { contains: options.query, mode: "insensitive" } },
        { owner: { email: { contains: options.query, mode: "insensitive" } } },
      ],
    }),
  };
  const [items, total] = await Promise.all([
    db.business.findMany({
      where,
      // The review queue is first come, first served; other lists show recent changes first.
      orderBy:
        options.status === "PENDING"
          ? [{ submittedAt: "asc" }, { createdAt: "asc" }]
          : [{ updatedAt: "desc" }],
      skip: skip(options.page, options.pageSize),
      take: options.pageSize,
      select: {
        id: true,
        slug: true,
        name: true,
        status: true,
        isFeatured: true,
        isDemo: true,
        submittedAt: true,
        updatedAt: true,
        district: { select: { name: true } },
        owner: { select: { name: true, email: true } },
        _count: { select: { reports: { where: { status: "OPEN" } } } },
      },
    }),
    db.business.count({ where }),
  ]);
  return { items, total };
}

export async function findListingForAdmin(id: string) {
  return db.business.findUnique({
    where: { id },
    include: {
      ...businessProfileInclude,
      owner: { select: { id: true, name: true, email: true, createdAt: true } },
      reports: {
        where: { status: "OPEN" },
        orderBy: { createdAt: "desc" },
        select: { id: true, reason: true, message: true, createdAt: true },
      },
      claimRequests: {
        where: { status: "PENDING" },
        select: { id: true, user: { select: { name: true } } },
      },
    },
  });
}

export type AdminListing = NonNullable<Awaited<ReturnType<typeof findListingForAdmin>>>;

/** Changes a listing's status if it's still in one of `from`. Returns false if it wasn't. */
export async function transitionListing(options: {
  id: string;
  from: BusinessStatus[];
  data: Prisma.BusinessUpdateManyMutationInput;
  audit: AuditEntry;
}) {
  return db.$transaction(async (tx) => {
    const changed = await tx.business.updateMany({
      where: { id: options.id, status: { in: options.from } },
      data: options.data,
    });
    if (changed.count === 0) return false;
    await tx.auditLog.create({ data: options.audit });
    return true;
  });
}

// Claims ---------------------------------------------------------------------------------------

const claimSummarySelect = {
  id: true,
  status: true,
  relationship: true,
  createdAt: true,
  decidedAt: true,
  business: { select: { id: true, name: true, slug: true, ownerId: true } },
  user: { select: { name: true, email: true } },
} satisfies Prisma.ClaimRequestSelect;

export async function listClaimsForAdmin(options: {
  status: ClaimStatus;
  page: number;
  pageSize: number;
}) {
  const where = { status: options.status };
  const [items, total] = await Promise.all([
    db.claimRequest.findMany({
      where,
      orderBy: { createdAt: options.status === "PENDING" ? "asc" : "desc" },
      skip: skip(options.page, options.pageSize),
      take: options.pageSize,
      select: claimSummarySelect,
    }),
    db.claimRequest.count({ where }),
  ]);
  return { items, total };
}

export async function findClaimForAdmin(id: string) {
  return db.claimRequest.findUnique({
    where: { id },
    include: {
      business: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          ownerId: true,
          phone: true,
          whatsapp: true,
          email: true,
          district: { select: { name: true } },
        },
      },
      user: { select: { id: true, name: true, email: true, createdAt: true } },
    },
  });
}

export async function findClaimEvidence(id: string) {
  return db.claimRequest.findUnique({
    where: { id },
    select: { evidenceKey: true, evidenceType: true },
  });
}

type ClaimPerson = { id: string; name: string; email: string };

/**
 * Gives the listing to the claimant (only if nobody manages it yet), turns down any other
 * pending requests for the same listing, and makes the claimant an owner.
 */
export async function approveClaim(options: {
  claimId: string;
  audit: Omit<AuditEntry, "targetId">;
}) {
  return db.$transaction(async (tx) => {
    const claim = await tx.claimRequest.findFirst({
      where: { id: options.claimId, status: "PENDING" },
      include: {
        business: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });
    if (!claim) return { outcome: "not-pending" as const };

    const taken = await tx.business.updateMany({
      where: { id: claim.businessId, ownerId: null },
      data: { ownerId: claim.userId },
    });
    if (taken.count === 0) return { outcome: "has-owner" as const };

    const now = new Date();
    await tx.claimRequest.update({
      where: { id: claim.id },
      data: { status: "APPROVED", decidedAt: now },
    });
    const others = await tx.claimRequest.findMany({
      where: { businessId: claim.businessId, status: "PENDING" },
      select: { id: true, user: { select: { id: true, name: true, email: true } } },
    });
    await tx.claimRequest.updateMany({
      where: { id: { in: others.map((o) => o.id) } },
      data: {
        status: "REJECTED",
        decidedAt: now,
        decisionNote: "Another request to manage this listing was approved.",
      },
    });
    await tx.user.updateMany({
      where: { id: claim.userId, role: "VISITOR" },
      data: { role: "OWNER" },
    });
    await tx.auditLog.create({ data: { ...options.audit, targetId: claim.id } });

    return {
      outcome: "approved" as const,
      business: claim.business,
      claimant: claim.user as ClaimPerson,
      turnedDown: others.map((o) => o.user as ClaimPerson),
    };
  });
}

export async function rejectClaim(options: { claimId: string; note: string; audit: AuditEntry }) {
  return db.$transaction(async (tx) => {
    const changed = await tx.claimRequest.updateMany({
      where: { id: options.claimId, status: "PENDING" },
      data: { status: "REJECTED", decisionNote: options.note, decidedAt: new Date() },
    });
    if (changed.count === 0) return false;
    await tx.auditLog.create({ data: options.audit });
    return true;
  });
}

// Reports --------------------------------------------------------------------------------------

export async function findOpenReport(businessId: string, reporterId: string) {
  return db.report.findFirst({
    where: { businessId, reporterId, status: "OPEN" },
    select: { id: true },
  });
}

export async function countOpenReportsByUser(reporterId: string) {
  return db.report.count({ where: { reporterId, status: "OPEN" } });
}

export async function createReport(data: {
  businessId: string;
  reporterId: string;
  reason: ReportReason;
  message: string;
}) {
  return db.report.create({ data, select: { id: true } });
}

export async function listReportsForAdmin(options: {
  status: ReportStatus;
  page: number;
  pageSize: number;
}) {
  const where = { status: options.status };
  const [items, total] = await Promise.all([
    db.report.findMany({
      where,
      orderBy: { createdAt: options.status === "OPEN" ? "asc" : "desc" },
      skip: skip(options.page, options.pageSize),
      take: options.pageSize,
      select: {
        id: true,
        reason: true,
        message: true,
        status: true,
        resolutionNote: true,
        createdAt: true,
        resolvedAt: true,
        business: { select: { id: true, name: true, slug: true, status: true } },
        reporter: { select: { name: true, email: true } },
      },
    }),
    db.report.count({ where }),
  ]);
  return { items, total };
}

export async function closeReport(options: {
  reportId: string;
  status: Exclude<ReportStatus, "OPEN">;
  note: string | null;
  audit: AuditEntry;
}) {
  return db.$transaction(async (tx) => {
    const changed = await tx.report.updateMany({
      where: { id: options.reportId, status: "OPEN" },
      data: { status: options.status, resolutionNote: options.note, resolvedAt: new Date() },
    });
    if (changed.count === 0) return false;
    await tx.auditLog.create({ data: options.audit });
    return true;
  });
}

export async function findReportTarget(reportId: string) {
  return db.report.findUnique({
    where: { id: reportId },
    select: { id: true, business: { select: { name: true } } },
  });
}

// Audit log ------------------------------------------------------------------------------------

export async function listAuditLogs(options: {
  page: number;
  pageSize: number;
  targetIds?: string[];
}) {
  const where: Prisma.AuditLogWhereInput = options.targetIds
    ? { targetId: { in: options.targetIds } }
    : {};
  const [items, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: skip(options.page, options.pageSize),
      take: options.pageSize,
      select: {
        id: true,
        action: true,
        targetType: true,
        targetId: true,
        summary: true,
        details: true,
        createdAt: true,
        actor: { select: { name: true, email: true } },
      },
    }),
    db.auditLog.count({ where }),
  ]);
  return { items, total };
}
