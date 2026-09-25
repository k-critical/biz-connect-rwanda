"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { toFormState, type FormState } from "@/lib/form-state";
import { getSession } from "@/server/auth/session";
import { withdrawClaim } from "@/server/services/claim-service";
import {
  addPhoto,
  deleteListing,
  movePhoto,
  removePhoto,
  saveContact,
  saveDetails,
  saveHours,
  saveShowcase,
  startListing,
  submitForReview,
  updatePhotoAlt,
  type Owner,
  type PhotoMove,
} from "@/server/services/listing-service";

// Every action checks who is signed in and passes only that person to the services, which
// check ownership again. Nothing about who owns what is taken from the form.

const SIGNED_OUT: FormState = {
  status: "error",
  message: "You've been signed out. Sign in again, then try once more.",
  fieldErrors: {},
};

async function currentOwner(): Promise<Owner | null> {
  const session = await getSession();
  if (!session) return null;
  const { id, name, email } = session.user;
  return { id, name, email };
}

const text = (form: FormData, key: string) => {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
};

const detailsInput = (form: FormData) => ({
  name: text(form, "name"),
  tagline: text(form, "tagline"),
  description: text(form, "description"),
  category: text(form, "category"),
  extraCategories: form.getAll("extraCategories").filter((v) => typeof v === "string"),
  district: text(form, "district"),
  priceLevel: text(form, "priceLevel"),
});

const contactInput = (form: FormData) => ({
  sector: text(form, "sector"),
  address: text(form, "address"),
  latitude: text(form, "latitude"),
  longitude: text(form, "longitude"),
  whatsapp: text(form, "whatsapp"),
  phone: text(form, "phone"),
  email: text(form, "email"),
  website: text(form, "website"),
  facebookUrl: text(form, "facebookUrl"),
  instagramUrl: text(form, "instagramUrl"),
});

/** In the wizard, saving moves on to the next step; on the dashboard it stays put. */
function afterSave(form: FormData, id: string, nextStep: string): FormState {
  if (text(form, "mode") === "wizard") redirect(`/list-your-business/${id}/${nextStep}`);
  refresh();
  return { status: "success", message: "Saved. Your changes are stored." };
}

export async function startListingAction(form: FormData): Promise<FormState> {
  const owner = await currentOwner();
  if (!owner) return SIGNED_OUT;
  const result = await startListing(owner, detailsInput(form));
  if (!result.ok) return toFormState(result, "");
  redirect(`/list-your-business/${result.value.id}/contact`);
}

export async function saveDetailsAction(form: FormData): Promise<FormState> {
  const owner = await currentOwner();
  if (!owner) return SIGNED_OUT;
  const id = text(form, "businessId");
  const result = await saveDetails(owner, id, detailsInput(form));
  return result.ok ? afterSave(form, id, "contact") : toFormState(result, "");
}

export async function saveContactAction(form: FormData): Promise<FormState> {
  const owner = await currentOwner();
  if (!owner) return SIGNED_OUT;
  const id = text(form, "businessId");
  const result = await saveContact(owner, id, contactInput(form));
  return result.ok ? afterSave(form, id, "hours") : toFormState(result, "");
}

export async function saveHoursAction(form: FormData): Promise<FormState> {
  const owner = await currentOwner();
  if (!owner) return SIGNED_OUT;
  const id = text(form, "businessId");
  const result = await saveHours(owner, id, text(form, "hours"));
  return result.ok ? afterSave(form, id, "review") : toFormState(result, "");
}

export async function saveShowcaseAction(form: FormData): Promise<FormState> {
  const owner = await currentOwner();
  if (!owner) return SIGNED_OUT;
  const id = text(form, "businessId");
  const result = await saveShowcase(owner, id, text(form, "showcase"));
  if (!result.ok) return toFormState(result, "");
  refresh();
  return { status: "success", message: "Saved. Visitors will see this on your listing." };
}

// Photos ---------------------------------------------------------------------------------------

export async function uploadPhotoAction(form: FormData): Promise<FormState> {
  const owner = await currentOwner();
  if (!owner) return SIGNED_OUT;
  const result = await addPhoto(
    owner,
    text(form, "businessId"),
    form.get("photo"),
    text(form, "altText"),
  );
  if (!result.ok) return toFormState(result, "");
  refresh();
  return { status: "success", message: "Photo added." };
}

export async function updatePhotoAltAction(form: FormData): Promise<FormState> {
  const owner = await currentOwner();
  if (!owner) return SIGNED_OUT;
  const result = await updatePhotoAlt(
    owner,
    text(form, "businessId"),
    text(form, "photoId"),
    text(form, "altText"),
  );
  if (!result.ok) return toFormState(result, "");
  refresh();
  return { status: "success", message: "Description saved." };
}

const MOVES: PhotoMove[] = ["up", "down", "cover"];

export async function movePhotoAction(form: FormData): Promise<FormState> {
  const owner = await currentOwner();
  if (!owner) return SIGNED_OUT;
  const move = MOVES.find((m) => m === text(form, "move"));
  if (!move) return { status: "error", message: "Unknown action.", fieldErrors: {} };
  const result = await movePhoto(owner, text(form, "businessId"), text(form, "photoId"), move);
  if (!result.ok) return toFormState(result, "");
  refresh();
  return {
    status: "success",
    message: move === "cover" ? "Cover photo changed." : "Photo moved.",
  };
}

export async function deletePhotoAction(form: FormData): Promise<FormState> {
  const owner = await currentOwner();
  if (!owner) return SIGNED_OUT;
  const result = await removePhoto(owner, text(form, "businessId"), text(form, "photoId"));
  if (!result.ok) return toFormState(result, "");
  refresh();
  return { status: "success", message: "Photo removed." };
}

// Review, deletion and claims ------------------------------------------------------------------

export async function submitListingAction(form: FormData): Promise<FormState> {
  const owner = await currentOwner();
  if (!owner) return SIGNED_OUT;
  const id = text(form, "businessId");
  const result = await submitForReview(owner, id, text(form, "confirm") === "yes");
  if (!result.ok) return toFormState(result, "");
  redirect(`/dashboard/${id}?submitted=1`);
}

export async function deleteListingAction(form: FormData): Promise<FormState> {
  const owner = await currentOwner();
  if (!owner) return SIGNED_OUT;
  const result = await deleteListing(owner, text(form, "businessId"));
  if (!result.ok) return toFormState(result, "");
  redirect("/dashboard?deleted=1");
}

export async function withdrawClaimAction(form: FormData): Promise<FormState> {
  const owner = await currentOwner();
  if (!owner) return SIGNED_OUT;
  const result = await withdrawClaim(owner.id, text(form, "claimId"));
  if (!result.ok) return toFormState(result, "");
  refresh();
  return { status: "success", message: "Request withdrawn." };
}
