"use client";

import { Send } from "lucide-react";
import { submitListingAction } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { FormMessage } from "./form-message";
import { useFormAction } from "./use-form-action";

export function SubmitListingForm({ businessId, ready }: { businessId: string; ready: boolean }) {
  const { state, pending, onSubmit, formRef, errorFor } = useFormAction(submitListingAction);
  const confirmError = errorFor("confirm");

  return (
    <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-4">
      <FormMessage state={state} />
      <input type="hidden" name="businessId" value={businessId} />
      <label className="flex cursor-pointer items-start gap-3 text-sm">
        <input
          type="checkbox"
          name="confirm"
          value="yes"
          required
          aria-invalid={confirmError ? true : undefined}
          aria-describedby={confirmError ? "confirm-error" : undefined}
          className="mt-0.5 size-5 shrink-0 accent-primary"
        />
        <span>
          I own or manage this business, and the details are true. I understand an admin will check
          the listing before it appears on BizConnect Rwanda.
        </span>
      </label>
      {confirmError && (
        <p id="confirm-error" className="text-sm font-medium text-danger">
          {confirmError}
        </p>
      )}
      <Button type="submit" size="lg" loading={pending} disabled={!ready} className="self-start">
        <Send aria-hidden /> Send for review
      </Button>
    </form>
  );
}
