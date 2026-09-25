"use client";

import { REPORT_REASONS } from "@/lib/audit";
import { submitReportAction } from "@/app/b/[slug]/report/actions";
import { Button } from "@/components/ui/button";
import { SelectField, TextAreaField } from "@/components/ui/field";
import { FormMessage } from "./form-message";
import { useFormAction } from "./use-form-action";

export function ReportForm({ slug }: { slug: string }) {
  const { state, pending, onSubmit, formRef, errorFor } = useFormAction(submitReportAction);
  return (
    <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-6">
      <FormMessage state={state} />
      <input type="hidden" name="slug" value={slug} />
      <SelectField
        label="What's wrong?"
        name="reason"
        required
        defaultValue=""
        error={errorFor("reason")}
      >
        <option value="" disabled>
          Choose one…
        </option>
        {Object.entries(REPORT_REASONS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </SelectField>
      <TextAreaField
        label="Tell us more"
        name="message"
        required
        rows={5}
        minLength={10}
        maxLength={1000}
        hint="For example, the correct phone number, or when it closed. Only admins see this."
        error={errorFor("message")}
      />
      <Button type="submit" size="lg" loading={pending} className="self-start">
        Send report
      </Button>
    </form>
  );
}
