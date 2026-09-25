"use server";

import { refresh } from "next/cache";
import { toFormState, type FormState } from "@/lib/form-state";
import { hasRole } from "@/lib/roles";
import { getSession } from "@/server/auth/session";
import {
  closeReportAs,
  decideClaim,
  decideListing,
  setListingFeatured,
  type Admin,
  type ListingDecision,
} from "@/server/services/admin-service";

// Every action re-reads the role from the database, so a removed admin can't keep acting.
const NOT_ALLOWED: FormState = {
  status: "error",
  message: "Only admins can do this. Sign in again with an admin account.",
  fieldErrors: {},
};

async function currentAdmin(): Promise<Admin | null> {
  const session = await getSession({ fresh: true });
  if (!session || !hasRole(session.user.role, "ADMIN")) return null;
  return { id: session.user.id, name: session.user.name };
}

const text = (form: FormData, key: string) => {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
};

function done(result: Awaited<ReturnType<typeof decideListing>>, message: string): FormState {
  if (!result.ok) return toFormState(result, "");
  refresh();
  return { status: "success", message };
}

const LISTING_DECISIONS: Record<ListingDecision, string> = {
  approve: "Approved. The listing is live and the owner has been emailed.",
  reject: "Sent back to the owner with your note.",
  suspend: "Suspended. The listing is hidden and the owner has been emailed.",
  restore: "Restored. The listing is live again.",
};

export async function decideListingAction(form: FormData): Promise<FormState> {
  const admin = await currentAdmin();
  if (!admin) return NOT_ALLOWED;
  const decision = (Object.keys(LISTING_DECISIONS) as ListingDecision[]).find(
    (d) => d === text(form, "decision"),
  );
  if (!decision) return { status: "error", message: "Unknown decision.", fieldErrors: {} };
  const result = await decideListing(admin, text(form, "businessId"), decision, text(form, "note"));
  return done(result, LISTING_DECISIONS[decision]);
}

export async function featureListingAction(form: FormData): Promise<FormState> {
  const admin = await currentAdmin();
  if (!admin) return NOT_ALLOWED;
  const featured = text(form, "featured") === "yes";
  const result = await setListingFeatured(admin, text(form, "businessId"), featured);
  return done(result, featured ? "Featured on the home page." : "No longer featured.");
}

export async function decideClaimAction(form: FormData): Promise<FormState> {
  const admin = await currentAdmin();
  if (!admin) return NOT_ALLOWED;
  const decision = text(form, "decision") === "approve" ? "approve" : "reject";
  const result = await decideClaim(admin, text(form, "claimId"), decision, text(form, "note"));
  return done(
    result,
    decision === "approve"
      ? "Approved. The listing is now in their dashboard, and they've been emailed."
      : "Turned down. They've been emailed your note.",
  );
}

export async function closeReportAction(form: FormData): Promise<FormState> {
  const admin = await currentAdmin();
  if (!admin) return NOT_ALLOWED;
  const outcome = text(form, "outcome") === "resolve" ? "resolve" : "dismiss";
  const result = await closeReportAs(admin, text(form, "reportId"), outcome, text(form, "note"));
  return done(result, outcome === "resolve" ? "Marked as resolved." : "Dismissed.");
}
