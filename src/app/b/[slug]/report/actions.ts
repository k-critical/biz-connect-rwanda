"use server";

import { redirect } from "next/navigation";
import { toFormState, type FormState } from "@/lib/form-state";
import { getSession } from "@/server/auth/session";
import { submitReport } from "@/server/services/admin-service";

const text = (form: FormData, key: string) => {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
};

export async function submitReportAction(form: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) {
    return {
      status: "error",
      message: "You've been signed out. Sign in again, then try once more.",
      fieldErrors: {},
    };
  }
  const { id, name, email } = session.user;
  const slug = text(form, "slug");
  const result = await submitReport({ id, name, email }, slug, {
    reason: text(form, "reason"),
    message: text(form, "message"),
  });
  if (!result.ok) return toFormState(result, "");
  redirect(`/b/${encodeURIComponent(slug)}?reported=1`);
}
