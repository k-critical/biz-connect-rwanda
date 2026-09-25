"use client";

import { useId } from "react";
import type { FormState } from "@/lib/form-state";
import { FormMessage } from "@/components/owner/form-message";
import { useFormAction } from "@/components/owner/use-form-action";
import { Button, type ButtonVariant } from "@/components/ui/button";
import { TextAreaField } from "@/components/ui/field";

/**
 * One admin decision: hidden fields saying what to act on, an optional note, and a button.
 * `note: "required"` is for reasons that are emailed to the owner or claimant.
 */
export function DecisionForm({
  action,
  fields,
  submitLabel,
  variant = "primary",
  note,
  noteLabel = "Note",
  noteHint,
  confirm,
}: {
  action: (form: FormData) => Promise<FormState>;
  fields: Record<string, string>;
  submitLabel: string;
  variant?: ButtonVariant;
  note?: "required" | "optional";
  noteLabel?: string;
  noteHint?: string;
  confirm?: string;
}) {
  const { state, pending, onSubmit, formRef, errorFor } = useFormAction(action);
  const id = useId();

  return (
    <form
      ref={formRef}
      onSubmit={(event) => {
        if (confirm && !window.confirm(confirm)) {
          event.preventDefault();
          return;
        }
        onSubmit(event);
      }}
      className="flex flex-col gap-3"
    >
      <FormMessage state={state} />
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {note && (
        <TextAreaField
          id={`${id}-note`}
          label={noteLabel}
          name="note"
          rows={3}
          required={note === "required"}
          minLength={note === "required" ? 10 : undefined}
          maxLength={1000}
          hint={noteHint}
          error={errorFor("note")}
        />
      )}
      <Button type="submit" variant={variant} loading={pending} className="self-start">
        {submitLabel}
      </Button>
    </form>
  );
}
