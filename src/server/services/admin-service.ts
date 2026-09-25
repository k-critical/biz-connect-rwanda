import "server-only";
import { z } from "zod";
import { env } from "@/config/env";
import { decisionNoteSchema, reportSchema, resolutionNoteSchema } from "@/lib/audit";
import { fail, ok, type ServiceResult } from "@/lib/form-state";
import type { ListingStatus } from "@/lib/listing-status";
import { queueEmail } from "@/server/mail/mailer";
import {
  claimApprovedEmail,
  claimRejectedEmail,
  listingApprovedEmail,
  listingNeedsChangesEmail,
  listingRestoredEmail,
  listingSuspendedEmail,
  type EmailMessage,
} from "@/server/mail/templates";
import {
  approveClaim,
  closeReport,
  countOpenReportsByUser,
  createReport,
  findClaimEvidence,
  findClaimForAdmin,
  findListingForAdmin,
  findOpenReport,
  findReportTarget,
  getAdminCounts,
  listAuditLogs,
  listClaimsForAdmin,
  listListingsForAdmin,
  listReportsForAdmin,
  rejectClaim,
  transitionListing,
} from "@/server/repositories/admin-repository";
import { findBusinessForClaim } from "@/server/repositories/claim-repository";
import { storage } from "@/server/storage";

export type Admin = { id: string; name: string };
export type Person = { id: string; name: string; email: string };

export const ADMIN_PAGE_SIZE = 20;

const STALE = fail("Someone already changed this. Reload the page to see where it stands.");
const isUuid = (value: string) => z.uuid().safeParse(value).success;
const noteError = (error: z.ZodError) =>
  fail(error.issues[0]!.message, { note: error.issues[0]!.message });

// Reads ----------------------------------------------------------------------------------------

export const getAdminCounters = () => getAdminCounts();

export const getAdminOverview = async () => {
  const [counts, recent] = await Promise.all([
    getAdminCounts(),
    listAuditLogs({ page: 1, pageSize: 8 }),
  ]);
  return { counts, recent: recent.items };
};

export const getListingQueue = (status: ListingStatus, page: number, query?: string) =>
  listListingsForAdmin({ status, page, pageSize: ADMIN_PAGE_SIZE, query });

export async function getListingForAdmin(id: string) {
  if (!isUuid(id)) return null;
  const listing = await findListingForAdmin(id);
  if (!listing) return null;
  const history = await listAuditLogs({
    page: 1,
    pageSize: 20,
    targetIds: [listing.id, ...listing.reports.map((r) => r.id)],
  });
  return { listing, history: history.items };
}

export const getClaimQueue = (status: "PENDING" | "APPROVED" | "REJECTED", page: number) =>
  listClaimsForAdmin({ status, page, pageSize: ADMIN_PAGE_SIZE });

export async function getClaimForAdmin(id: string) {
  return isUuid(id) ? findClaimForAdmin(id) : null;
}

/** The private proof attached to a claim, for an admin to look at. */
export async function getClaimEvidenceFile(id: string) {
  if (!isUuid(id)) return null;
  const claim = await findClaimEvidence(id);
  if (!claim?.evidenceKey || !claim.evidenceType) return null;
  const data = await storage.get(claim.evidenceKey);
  return data ? { data, type: claim.evidenceType } : null;
}

export const getReportQueue = (status: "OPEN" | "RESOLVED" | "DISMISSED", page: number) =>
  listReportsForAdmin({ status, page, pageSize: ADMIN_PAGE_SIZE });

export const getAuditLog = (page: number) => listAuditLogs({ page, pageSize: ADMIN_PAGE_SIZE });

// Listing decisions ----------------------------------------------------------------------------

export type ListingDecision = "approve" | "reject" | "suspend" | "restore";

const DECISIONS: Record<
  ListingDecision,
  { from: ListingStatus[]; to: ListingStatus; action: string; verb: string; needsNote: boolean }
> = {
  approve: {
    from: ["PENDING", "REJECTED"],
    to: "APPROVED",
    action: "listing.approve",
    verb: "Approved",
    needsNote: false,
  },
  reject: {
    from: ["PENDING"],
    to: "REJECTED",
    action: "listing.reject",
    verb: "Asked for changes to",
    needsNote: true,
  },
  suspend: {
    from: ["APPROVED"],
    to: "SUSPENDED",
    action: "listing.suspend",
    verb: "Suspended",
    needsNote: true,
  },
  restore: {
    from: ["SUSPENDED"],
    to: "APPROVED",
    action: "listing.restore",
    verb: "Restored",
    needsNote: false,
  },
};

export async function decideListing(
  admin: Admin,
  id: string,
  decision: ListingDecision,
  rawNote: unknown,
): Promise<ServiceResult> {
  const rule = DECISIONS[decision];
  const listing = await getListingForAdmin(id);
  if (!listing) return fail("That listing no longer exists.");
  const b = listing.listing;

  let note: string | null = null;
  if (rule.needsNote) {
    const parsed = decisionNoteSchema.safeParse(rawNote ?? "");
    if (!parsed.success) return noteError(parsed.error);
    note = parsed.data;
  }

  const changed = await transitionListing({
    id: b.id,
    from: rule.from,
    data: {
      status: rule.to,
      reviewedAt: new Date(),
      // A note stays with the listing while it needs changes or is hidden; approval clears it.
      reviewNote: note,
      ...(rule.to !== "APPROVED" && { isFeatured: false }),
    },
    audit: {
      actorId: admin.id,
      action: rule.action,
      targetType: "business",
      targetId: b.id,
      summary: `${rule.verb} ${b.name}`,
      ...(note && { details: { note } }),
    },
  });
  if (!changed) return STALE;

  if (b.owner) {
    const site = env.NEXT_PUBLIC_SITE_URL;
    const email: Record<ListingDecision, () => EmailMessage> = {
      approve: () => listingApprovedEmail(b.owner!, b, site),
      reject: () => listingNeedsChangesEmail(b.owner!, b.name, note!, site),
      suspend: () => listingSuspendedEmail(b.owner!, b.name, note!, site),
      restore: () => listingRestoredEmail(b.owner!, b, site),
    };
    await queueEmail(email[decision]());
  }
  return ok(undefined);
}

export async function setListingFeatured(
  admin: Admin,
  id: string,
  featured: boolean,
): Promise<ServiceResult> {
  const found = await getListingForAdmin(id);
  if (!found) return fail("That listing no longer exists.");
  const b = found.listing;
  if (b.status !== "APPROVED") return fail("Only live listings can be featured.");
  const changed = await transitionListing({
    id: b.id,
    from: ["APPROVED"],
    data: { isFeatured: featured },
    audit: {
      actorId: admin.id,
      action: featured ? "listing.feature" : "listing.unfeature",
      targetType: "business",
      targetId: b.id,
      summary: `${featured ? "Featured" : "Stopped featuring"} ${b.name}`,
    },
  });
  return changed ? ok(undefined) : STALE;
}

// Claims ---------------------------------------------------------------------------------------

export async function decideClaim(
  admin: Admin,
  claimId: string,
  decision: "approve" | "reject",
  rawNote: unknown,
): Promise<ServiceResult> {
  const claim = await getClaimForAdmin(claimId);
  if (!claim) return fail("That request no longer exists.");
  const site = env.NEXT_PUBLIC_SITE_URL;

  if (decision === "reject") {
    const parsed = decisionNoteSchema.safeParse(rawNote ?? "");
    if (!parsed.success) return noteError(parsed.error);
    const changed = await rejectClaim({
      claimId: claim.id,
      note: parsed.data,
      audit: {
        actorId: admin.id,
        action: "claim.reject",
        targetType: "claim",
        targetId: claim.id,
        summary: `Turned down ${claim.user.name}'s request to manage ${claim.business.name}`,
        details: { note: parsed.data },
      },
    });
    if (!changed) return STALE;
    await queueEmail(claimRejectedEmail(claim.user, claim.business.name, parsed.data, site));
    return ok(undefined);
  }

  const result = await approveClaim({
    claimId: claim.id,
    audit: {
      actorId: admin.id,
      action: "claim.approve",
      targetType: "claim",
      summary: `Gave ${claim.business.name} to ${claim.user.name}`,
    },
  });
  if (result.outcome === "not-pending") return STALE;
  if (result.outcome === "has-owner") {
    return fail("Someone already manages this listing, so it can't be given to this person.");
  }
  await queueEmail(claimApprovedEmail(result.claimant, result.business.name, site));
  for (const person of result.turnedDown) {
    await queueEmail(
      claimRejectedEmail(
        person,
        result.business.name,
        "Another request to manage this listing was approved.",
        site,
      ),
    );
  }
  return ok(undefined);
}

// Reports --------------------------------------------------------------------------------------

const MAX_OPEN_REPORTS = 5;

/** A signed-in visitor flags a live listing. */
export async function submitReport(
  reporter: Person,
  slug: string,
  raw: unknown,
): Promise<ServiceResult> {
  const business = await findBusinessForClaim(slug);
  if (!business) return fail("We couldn't find that listing.");
  if (business.ownerId === reporter.id) {
    return fail("This is your own listing. Update it from your dashboard instead.");
  }
  const parsed = reportSchema.safeParse(raw);
  if (!parsed.success) {
    const errors = Object.fromEntries(
      parsed.error.issues.map((i) => [String(i.path[0]), i.message]),
    );
    return fail("Some details need another look. Check the messages below.", errors);
  }
  if (await findOpenReport(business.id, reporter.id)) {
    return fail("You've already reported this listing. An admin will look at it soon.");
  }
  if ((await countOpenReportsByUser(reporter.id)) >= MAX_OPEN_REPORTS) {
    return fail("You have several reports waiting already. Please wait until they're checked.");
  }
  await createReport({ businessId: business.id, reporterId: reporter.id, ...parsed.data });
  return ok(undefined);
}

export async function closeReportAs(
  admin: Admin,
  reportId: string,
  outcome: "resolve" | "dismiss",
  rawNote: unknown,
): Promise<ServiceResult> {
  if (!isUuid(reportId)) return fail("That report no longer exists.");
  const report = await findReportTarget(reportId);
  if (!report) return fail("That report no longer exists.");
  const note = resolutionNoteSchema.safeParse(rawNote ?? "");
  if (!note.success) return noteError(note.error);

  const changed = await closeReport({
    reportId,
    status: outcome === "resolve" ? "RESOLVED" : "DISMISSED",
    note: note.data,
    audit: {
      actorId: admin.id,
      action: outcome === "resolve" ? "report.resolve" : "report.dismiss",
      targetType: "report",
      targetId: reportId,
      summary: `${outcome === "resolve" ? "Resolved" : "Dismissed"} a report about ${report.business.name}`,
      ...(note.data && { details: { note: note.data } }),
    },
  });
  return changed ? ok(undefined) : STALE;
}
