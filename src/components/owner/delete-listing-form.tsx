"use client";

import { Trash2 } from "lucide-react";
import { deleteListingAction } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { FormMessage } from "./form-message";
import { useFormAction } from "./use-form-action";

export function DeleteListingForm({ businessId, name }: { businessId: string; name: string }) {
  const { state, pending, onSubmit, formRef } = useFormAction(deleteListingAction);
  return (
    <form
      ref={formRef}
      onSubmit={(event) => {
        if (!window.confirm(`Delete “${name}” and its photos? This can't be undone.`)) {
          event.preventDefault();
          return;
        }
        onSubmit(event);
      }}
      className="flex flex-col gap-3"
    >
      <FormMessage state={state} />
      <input type="hidden" name="businessId" value={businessId} />
      <Button type="submit" variant="danger" loading={pending} className="self-start">
        <Trash2 aria-hidden /> Delete this listing
      </Button>
    </form>
  );
}
