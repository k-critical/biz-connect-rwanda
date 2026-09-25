import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { env } from "@/config/env";
import { fail, ok, type ServiceResult } from "@/lib/form-state";
import {
  LISTING_LIMITS,
  altTextSchema,
  contactSchema,
  detailsSchema,
  fieldErrors,
  hoursSchema,
  showcaseSchema,
  type DetailsInput,
} from "@/lib/listing-rules";
import {
  canChangeSlug,
  canDeleteListing,
  canEditListing,
  canSubmitListing,
  isReadyToSubmit,
  listingChecklist,
} from "@/lib/listing-status";
import { photoFileKey, photoStorageKey, type MediaSize } from "@/lib/media";
import { slugify } from "@/lib/slug";
import {
  ImageRejectedError,
  IMAGE_REJECTION_MESSAGES,
  processPhoto,
} from "@/server/images/process-image";
import { queueEmail } from "@/server/mail/mailer";
import { listingSubmittedEmail } from "@/server/mail/templates";
import { listClaimsByUser } from "@/server/repositories/claim-repository";
import {
  countOwnedBusinesses,
  countPhotos,
  createDraftBusiness,
  createPhoto,
  deleteBusiness,
  deletePhoto,
  findCategoryIds,
  findDistrictBySlug,
  findOwnedBusiness,
  isSlugTaken,
  listOwnedBusinesses,
  listPhotoKeys,
  replaceOpeningHours,
  replaceShowcase,
  setBusinessStatus,
  setPhotoOrder,
  updateBusinessContact,
  updateBusinessDetails,
  updatePhotoAltText,
  type OwnedBusiness,
} from "@/server/repositories/listing-repository";
import { storage } from "@/server/storage";

export type Owner = { id: string; name: string; email: string };
export type { OwnedBusiness };

const CHECK_FORM = "Some details need another look. Check the messages below.";
const NOT_FOUND = fail("We couldn't find that listing in your account.");
const LOCKED = fail("This listing is suspended, so it can't be changed right now.");
const SIZES: MediaSize[] = ["sm", "md", "lg"];

const isUuid = (value: string) => z.uuid().safeParse(value).success;

/** The listing, if it exists and belongs to this owner. Anyone else gets null. */
export async function getOwnedListing(ownerId: string, id: string) {
  if (!isUuid(id)) return null;
  return findOwnedBusiness(id, ownerId);
}

async function loadEditable(ownerId: string, id: string): Promise<ServiceResult<OwnedBusiness>> {
  const business = await getOwnedListing(ownerId, id);
  if (!business) return NOT_FOUND;
  if (!canEditListing(business.status)) return LOCKED;
  return ok(business);
}

export function checklistFor(business: OwnedBusiness) {
  return listingChecklist({
    whatsapp: business.whatsapp,
    phone: business.phone,
    email: business.email,
    latitude: business.latitude,
    hoursCount: business.openingHours.length,
    photoCount: business.photos.length,
    showcaseCount: business.showcaseSections.length,
  });
}

export async function getOwnerDashboard(ownerId: string) {
  const [businesses, claims] = await Promise.all([
    listOwnedBusinesses(ownerId),
    listClaimsByUser(ownerId),
  ]);
  return { businesses, claims };
}

// The basics -----------------------------------------------------------------------------------

async function uniqueSlug(name: string, exceptId?: string) {
  const base = slugify(name);
  for (let n = 1; n <= 20; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    if (!(await isSlugTaken(candidate, exceptId))) return candidate;
  }
  return `${base}-${randomUUID().slice(0, 8)}`;
}

async function resolveDetails(input: DetailsInput) {
  const district = await findDistrictBySlug(input.district);
  if (!district) return fail(CHECK_FORM, { district: "Choose a district from the list." });
  const categoryIds = await findCategoryIds([input.category, ...input.extraCategories]);
  if (categoryIds.some((id) => id === undefined)) {
    return fail(CHECK_FORM, { category: "Choose a category from the list." });
  }
  return ok({
    districtId: district.id,
    categoryIds: categoryIds as number[],
    data: {
      name: input.name,
      tagline: input.tagline,
      description: input.description,
      priceLevel: input.priceLevel,
      districtId: district.id,
    },
  });
}

/** Step 1 of the wizard: saves a draft and makes the person an owner. */
export async function startListing(
  owner: Owner,
  raw: unknown,
): Promise<ServiceResult<{ id: string }>> {
  const parsed = detailsSchema.safeParse(raw);
  if (!parsed.success) return fail(CHECK_FORM, fieldErrors(parsed.error));

  if ((await countOwnedBusinesses(owner.id)) >= LISTING_LIMITS.listingsPerOwner) {
    return fail(
      `One account can manage up to ${LISTING_LIMITS.listingsPerOwner} listings. Contact the BizConnect team if you need more.`,
    );
  }
  const resolved = await resolveDetails(parsed.data);
  if (!resolved.ok) return resolved;

  const slug = await uniqueSlug(parsed.data.name);
  const business = await createDraftBusiness(
    owner.id,
    { ...resolved.value.data, slug },
    resolved.value.categoryIds,
  );
  return ok({ id: business.id });
}

export async function saveDetails(owner: Owner, id: string, raw: unknown): Promise<ServiceResult> {
  const loaded = await loadEditable(owner.id, id);
  if (!loaded.ok) return loaded;
  const business = loaded.value;

  const parsed = detailsSchema.safeParse(raw);
  if (!parsed.success) return fail(CHECK_FORM, fieldErrors(parsed.error));
  const resolved = await resolveDetails(parsed.data);
  if (!resolved.ok) return resolved;

  const slug =
    canChangeSlug(business.status) && parsed.data.name !== business.name
      ? await uniqueSlug(parsed.data.name, business.id)
      : business.slug;
  await updateBusinessDetails(
    business.id,
    { ...resolved.value.data, slug },
    resolved.value.categoryIds,
  );
  return ok(undefined);
}

// Contact, hours and showcase ------------------------------------------------------------------

export async function saveContact(owner: Owner, id: string, raw: unknown): Promise<ServiceResult> {
  const loaded = await loadEditable(owner.id, id);
  if (!loaded.ok) return loaded;
  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) return fail(CHECK_FORM, fieldErrors(parsed.error));
  await updateBusinessContact(loaded.value.id, parsed.data);
  return ok(undefined);
}

function parseJson(text: unknown): unknown {
  try {
    return JSON.parse(String(text));
  } catch {
    return undefined;
  }
}

export async function saveHours(owner: Owner, id: string, json: unknown): Promise<ServiceResult> {
  const loaded = await loadEditable(owner.id, id);
  if (!loaded.ok) return loaded;
  const parsed = hoursSchema.safeParse(parseJson(json));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? CHECK_FORM);
  await replaceOpeningHours(loaded.value.id, parsed.data);
  return ok(undefined);
}

export async function saveShowcase(
  owner: Owner,
  id: string,
  json: unknown,
): Promise<ServiceResult> {
  const loaded = await loadEditable(owner.id, id);
  if (!loaded.ok) return loaded;
  const parsed = showcaseSchema.safeParse(parseJson(json));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? CHECK_FORM);
  await replaceShowcase(loaded.value.id, parsed.data);
  return ok(undefined);
}

// Photos ---------------------------------------------------------------------------------------

const photoFileKeys = (storageKey: string) => SIZES.map((size) => photoFileKey(storageKey, size));

export async function addPhoto(
  owner: Owner,
  id: string,
  file: unknown,
  altText: unknown,
): Promise<ServiceResult> {
  const loaded = await loadEditable(owner.id, id);
  if (!loaded.ok) return loaded;
  const business = loaded.value;

  if (!(file instanceof Blob) || file.size === 0) return fail(IMAGE_REJECTION_MESSAGES.empty);
  if ((await countPhotos(business.id)) >= LISTING_LIMITS.photos) {
    return fail(`A listing can have up to ${LISTING_LIMITS.photos} photos. Remove one first.`);
  }
  const alt = altTextSchema.safeParse(altText ?? "");
  if (!alt.success) return fail(alt.error.issues[0]!.message);

  let processed;
  try {
    processed = await processPhoto(Buffer.from(await file.arrayBuffer()));
  } catch (error) {
    if (error instanceof ImageRejectedError) return fail(IMAGE_REJECTION_MESSAGES[error.reason]);
    throw error;
  }

  const storageKey = photoStorageKey(business.id, randomUUID());
  await Promise.all(
    SIZES.map((size) => storage.put(photoFileKey(storageKey, size), processed.files[size])),
  );
  try {
    await createPhoto({
      businessId: business.id,
      storageKey,
      width: processed.width,
      height: processed.height,
      blurDataUrl: processed.blurDataUrl,
      altText: alt.data || `Photo of ${business.name}`,
    });
  } catch (error) {
    await storage.delete(photoFileKeys(storageKey));
    throw error;
  }
  return ok(undefined);
}

export async function updatePhotoAlt(
  owner: Owner,
  id: string,
  photoId: string,
  altText: unknown,
): Promise<ServiceResult> {
  const loaded = await loadEditable(owner.id, id);
  if (!loaded.ok) return loaded;
  const alt = altTextSchema.safeParse(altText ?? "");
  if (!alt.success) return fail(alt.error.issues[0]!.message);
  if (!isUuid(photoId)) return fail("That photo no longer exists.");
  const updated = await updatePhotoAltText(
    loaded.value.id,
    photoId,
    alt.data || `Photo of ${loaded.value.name}`,
  );
  return updated ? ok(undefined) : fail("That photo no longer exists.");
}

export type PhotoMove = "up" | "down" | "cover";

export async function movePhoto(
  owner: Owner,
  id: string,
  photoId: string,
  move: PhotoMove,
): Promise<ServiceResult> {
  const loaded = await loadEditable(owner.id, id);
  if (!loaded.ok) return loaded;
  const ids = loaded.value.photos.map((photo) => photo.id);
  const from = ids.indexOf(photoId);
  if (from === -1) return fail("That photo no longer exists.");

  const to = move === "cover" ? 0 : move === "up" ? from - 1 : from + 1;
  if (to < 0 || to >= ids.length || to === from) return ok(undefined);
  ids.splice(from, 1);
  ids.splice(to, 0, photoId);
  await setPhotoOrder(loaded.value.id, ids);
  return ok(undefined);
}

export async function removePhoto(
  owner: Owner,
  id: string,
  photoId: string,
): Promise<ServiceResult> {
  const loaded = await loadEditable(owner.id, id);
  if (!loaded.ok) return loaded;
  if (!isUuid(photoId)) return fail("That photo no longer exists.");
  const storageKey = await deletePhoto(loaded.value.id, photoId);
  if (!storageKey) return fail("That photo no longer exists.");
  await storage.delete(photoFileKeys(storageKey));
  return ok(undefined);
}

// Review and removal ---------------------------------------------------------------------------

export async function submitForReview(
  owner: Owner,
  id: string,
  confirmed: boolean,
): Promise<ServiceResult> {
  const business = await getOwnedListing(owner.id, id);
  if (!business) return NOT_FOUND;
  if (!canSubmitListing(business.status)) {
    return fail("This listing has already been sent for review.");
  }
  if (!isReadyToSubmit(checklistFor(business))) {
    return fail("Add at least one way for customers to reach you before sending the listing.");
  }
  if (!confirmed) {
    return fail(CHECK_FORM, {
      confirm: "Please confirm that you run this business and the details are correct.",
    });
  }
  await setBusinessStatus(business.id, "PENDING", { submittedAt: new Date() });
  await queueEmail(listingSubmittedEmail(owner, business.name, env.NEXT_PUBLIC_SITE_URL));
  return ok(undefined);
}

export async function deleteListing(owner: Owner, id: string): Promise<ServiceResult> {
  const business = await getOwnedListing(owner.id, id);
  if (!business) return NOT_FOUND;
  if (!canDeleteListing(business.status)) {
    return fail("Only drafts and listings that need changes can be deleted.");
  }
  const keys = await listPhotoKeys(business.id);
  await deleteBusiness(business.id);
  await storage.delete(keys.flatMap(photoFileKeys));
  return ok(undefined);
}
