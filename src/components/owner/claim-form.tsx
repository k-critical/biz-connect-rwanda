"use client";

import { CLAIM_RELATIONSHIPS } from "@/lib/listing-rules";
import { submitClaimAction } from "@/app/b/[slug]/claim/actions";
import { Button } from "@/components/ui/button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { FormMessage } from "./form-message";
import { useFormAction } from "./use-form-action";

const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024;

export function ClaimForm({ slug, businessName }: { slug: string; businessName: string }) {
  const { state, setState, pending, onSubmit, formRef, errorFor } =
    useFormAction(submitClaimAction);

  return (
    <form
      ref={formRef}
      onSubmit={(event) => {
        const file = new FormData(event.currentTarget).get("evidence");
        if (file instanceof File && file.size > MAX_EVIDENCE_BYTES) {
          event.preventDefault();
          setState({
            status: "error",
            message: "That document couldn't be used.",
            fieldErrors: { evidence: "That file is too big. Documents can be up to 5 MB." },
          });
          return;
        }
        onSubmit(event);
      }}
      className="flex flex-col gap-6"
    >
      <FormMessage state={state} />
      <input type="hidden" name="slug" value={slug} />

      <SelectField
        label={`Your connection to ${businessName}`}
        name="relationship"
        required
        defaultValue=""
        error={errorFor("relationship")}
      >
        <option value="" disabled>
          Choose one…
        </option>
        {CLAIM_RELATIONSHIPS.map((relationship) => (
          <option key={relationship} value={relationship}>
            {relationship}
          </option>
        ))}
      </SelectField>

      <TextField
        label="Phone number we can call you on"
        name="contactPhone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        required
        placeholder="0788 123 456"
        hint="An admin may call to confirm. We don't show this number to anyone."
        error={errorFor("contactPhone")}
      />

      <TextAreaField
        label="How can we confirm it's your business?"
        name="message"
        required
        rows={5}
        minLength={20}
        maxLength={1000}
        hint="For example: your role, how long you've run it, and the phone number customers use to reach the business."
        error={errorFor("message")}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="evidence" className="text-sm font-semibold text-ink">
          Proof (optional, but it speeds things up)
        </label>
        <input
          id="evidence"
          name="evidence"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          aria-describedby="evidence-hint"
          aria-invalid={errorFor("evidence") ? true : undefined}
          className="text-sm file:mr-3 file:h-10 file:cursor-pointer file:rounded-lg file:border file:border-border-strong file:bg-surface file:px-4 file:font-semibold file:text-ink"
        />
        <p id="evidence-hint" className="text-sm text-ink-muted">
          A photo or PDF of your RDB registration certificate, trading licence, or a photo of you at
          the business. Up to 5 MB. Only admins can see it.
        </p>
        {errorFor("evidence") && (
          <p className="text-sm font-medium text-danger">{errorFor("evidence")}</p>
        )}
      </div>

      <Button type="submit" size="lg" loading={pending} className="self-start">
        Send request
      </Button>
    </form>
  );
}
