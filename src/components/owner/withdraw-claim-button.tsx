"use client";

import { withdrawClaimAction } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { FormMessage } from "./form-message";
import { useFormAction } from "./use-form-action";

export function WithdrawClaimButton({ claimId, name }: { claimId: string; name: string }) {
  const { state, pending, onSubmit, formRef } = useFormAction(withdrawClaimAction);
  return (
    <form
      ref={formRef}
      onSubmit={(event) => {
        if (!window.confirm(`Withdraw your request to manage “${name}”?`)) {
          event.preventDefault();
          return;
        }
        onSubmit(event);
      }}
      className="flex flex-col items-end gap-2"
    >
      {state.status === "error" && <FormMessage state={state} />}
      <input type="hidden" name="claimId" value={claimId} />
      <Button type="submit" variant="ghost" size="sm" loading={pending}>
        Withdraw<span className="sr-only"> request for {name}</span>
      </Button>
    </form>
  );
}
