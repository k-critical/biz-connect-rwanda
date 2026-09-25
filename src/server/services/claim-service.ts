import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { env } from "@/config/env";
import { fail, ok, type ServiceResult } from "@/lib/form-state";
import { claimSchema, fieldErrors } from "@/lib/listing-rules";
import { ImageRejectedError, processEvidence } from "@/server/images/process-image";
import { sendEmailInBackground } from "@/server/mail/mailer";
import { claimReceivedEmail } from "@/server/mail/templates";
import {
  countPendingClaimsByUser,
  createClaim,
  findBusinessForClaim,
  findPendingClaim,
  withdrawClaim as withdrawClaimRow,
} from "@/server/repositories/claim-repository";
import { storage } from "@/server/storage";
import type { Owner } from "./listing-service";

const MAX_PENDING_CLAIMS = 3;

const EVIDENCE_MESSAGES = {
  empty: "",
  "too-large": "That file is too big. Documents can be up to 5 MB.",
  "not-an-image": "Upload a photo (JPEG, PNG or WebP) or a PDF.",
  "unsupported-format": "Upload a photo (JPEG, PNG or WebP) or a PDF.",
  "too-small": "That photo is too small to read. Try a clearer one.",
} as const;

export type ClaimPageState =
  | { kind: "not-found" }
  | { kind: "owned-by-you" }
  | { kind: "already-managed" }
  | { kind: "pending"; since: Date }
  | { kind: "open" };

/** What the claim page should show for this business and person. */
export async function getClaimContext(slug: string, userId: string | null) {
  const business = await findBusinessForClaim(slug);
  if (!business) return { business: null, state: { kind: "not-found" } as ClaimPageState };

  let state: ClaimPageState = { kind: "open" };
  if (userId && business.ownerId === userId) state = { kind: "owned-by-you" };
  else if (business.ownerId) state = { kind: "already-managed" };
  else if (userId) {
    const pending = await findPendingClaim(business.id, userId);
    if (pending) state = { kind: "pending", since: pending.createdAt };
  }
  return {
    business: {
      id: business.id,
      name: business.name,
      slug: business.slug,
      district: business.district.name,
    },
    state,
  };
}

export async function submitClaim(
  user: Owner,
  slug: string,
  raw: unknown,
  evidence: unknown,
): Promise<ServiceResult> {
  const { business, state } = await getClaimContext(slug, user.id);
  if (!business) return fail("We couldn't find that listing.");
  if (state.kind === "owned-by-you") return fail("You already manage this listing.");
  if (state.kind === "already-managed") {
    return fail(
      "Someone already manages this listing. Contact the BizConnect team if that's wrong.",
    );
  }
  if (state.kind === "pending") return fail("You've already asked to manage this listing.");

  const parsed = claimSchema.safeParse(raw);
  if (!parsed.success) {
    return fail(
      "Some details need another look. Check the messages below.",
      fieldErrors(parsed.error),
    );
  }
  if ((await countPendingClaimsByUser(user.id)) >= MAX_PENDING_CLAIMS) {
    return fail("You have several requests waiting already. Please wait until they're checked.");
  }

  let evidenceKey: string | null = null;
  let evidenceType: string | null = null;
  if (evidence instanceof Blob && evidence.size > 0) {
    try {
      const file = await processEvidence(Buffer.from(await evidence.arrayBuffer()));
      evidenceKey = `private/claims/${randomUUID()}.${file.extension}`;
      evidenceType = file.type;
      await storage.put(evidenceKey, file.data);
    } catch (error) {
      if (error instanceof ImageRejectedError) {
        return fail("That document couldn't be used.", {
          evidence: EVIDENCE_MESSAGES[error.reason] || EVIDENCE_MESSAGES["not-an-image"],
        });
      }
      throw error;
    }
  }

  try {
    await createClaim({
      businessId: business.id,
      userId: user.id,
      ...parsed.data,
      evidenceKey,
      evidenceType,
    });
  } catch (error) {
    if (evidenceKey) await storage.delete([evidenceKey]);
    throw error;
  }
  sendEmailInBackground(claimReceivedEmail(user, business.name, env.NEXT_PUBLIC_SITE_URL));
  return ok(undefined);
}

export async function withdrawClaim(userId: string, claimId: string): Promise<ServiceResult> {
  if (!z.uuid().safeParse(claimId).success) return fail("That request no longer exists.");
  const result = await withdrawClaimRow(claimId, userId);
  if (!result.found) return fail("That request can no longer be withdrawn.");
  if (result.evidenceKey) await storage.delete([result.evidenceKey]);
  return ok(undefined);
}
