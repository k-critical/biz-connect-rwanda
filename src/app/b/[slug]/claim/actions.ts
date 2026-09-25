"use server";

import { redirect } from "next/navigation";
import { toFormState, type FormState } from "@/lib/form-state";
import { getSession } from "@/server/auth/session";
import { submitClaim } from "@/server/services/claim-service";

const text = (form: FormData, key: string) => {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
};

export async function submitClaimAction(form: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) {
    return {
      status: "error",
      message: "You've been signed out. Sign in again, then try once more.",
      fieldErrors: {},
    };
  }
  const { id, name, email } = session.user;
  const result = await submitClaim(
    { id, name, email },
    text(form, "slug"),
    {
      relationship: text(form, "relationship"),
      contactPhone: text(form, "contactPhone"),
      message: text(form, "message"),
    },
    form.get("evidence"),
  );
  if (!result.ok) return toFormState(result, "");
  redirect("/dashboard?claimed=1");
}
