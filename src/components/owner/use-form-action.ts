"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { IDLE, type FormState } from "@/lib/form-state";

/**
 * Sends a form to a server action without the browser clearing what was typed, keeps the
 * result for showing messages, and moves focus to the first field with a problem.
 */
export function useFormAction(
  action: (formData: FormData) => Promise<FormState | undefined>,
  options: { prepare?: (formData: FormData) => void | Promise<void> } = {},
) {
  const [state, setState] = useState<FormState>(IDLE);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status !== "error") return;
    const invalid = formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']");
    (invalid ?? formRef.current?.querySelector<HTMLElement>("[data-form-message]"))?.focus();
  }, [state]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      await options.prepare?.(formData);
      const result = await action(formData);
      // A redirecting action never returns a state.
      if (result) setState(result);
    });
  }

  const errorFor = (field: string) =>
    state.status === "error" ? state.fieldErrors[field] : undefined;

  return { state, setState, pending, onSubmit, formRef, errorFor };
}
