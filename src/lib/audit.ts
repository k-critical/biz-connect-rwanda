import { z } from "zod";

/** Every kind of admin action, with the words the audit log shows for it. */
export const AUDIT_ACTIONS = {
  "listing.approve": "Approved a listing",
  "listing.reject": "Asked for changes to a listing",
  "listing.suspend": "Suspended a listing",
  "listing.restore": "Restored a listing",
  "listing.feature": "Featured a listing",
  "listing.unfeature": "Stopped featuring a listing",
  "claim.approve": "Approved a claim",
  "claim.reject": "Turned down a claim",
  "report.resolve": "Resolved a report",
  "report.dismiss": "Dismissed a report",
} as const;

export type AuditAction = keyof typeof AUDIT_ACTIONS;

export const auditActionLabel = (action: string) =>
  Object.hasOwn(AUDIT_ACTIONS, action) ? AUDIT_ACTIONS[action as AuditAction] : action;

/** A reason an admin writes for the owner or claimant; it's emailed to them as written. */
export const decisionNoteSchema = z
  .string()
  .trim()
  .min(10, "Write a short reason (at least 10 characters). The owner will read it.")
  .max(1000, "Keep the reason under 1000 characters.");

/** An optional note on how a report was handled; only admins see it. */
export const resolutionNoteSchema = z
  .string()
  .trim()
  .max(1000, "Keep the note under 1000 characters.")
  .transform((value) => value || null);

export const REPORT_REASONS = {
  CLOSED: "It has closed or moved",
  WRONG_INFO: "Some details are wrong",
  NOT_REAL: "It isn't a real business",
  OFFENSIVE: "Offensive or inappropriate content",
  OTHER: "Something else",
} as const;

export type ReportReason = keyof typeof REPORT_REASONS;

export const reportSchema = z.object({
  reason: z.enum(
    Object.keys(REPORT_REASONS) as [ReportReason, ...ReportReason[]],
    "Choose what's wrong.",
  ),
  message: z
    .string()
    .trim()
    .min(10, "Tell us a little more (at least 10 characters).")
    .max(1000, "Keep the message under 1000 characters."),
});
