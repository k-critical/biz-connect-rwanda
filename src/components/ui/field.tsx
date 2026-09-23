import { useId, type ComponentProps, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

type FieldOwnProps = {
  label: string;
  hint?: string;
  error?: string;
};

const controlClasses =
  "w-full rounded-lg border bg-surface px-3.5 text-base text-ink placeholder:text-ink-subtle " +
  "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:opacity-70";

function useFieldIds(id: string | undefined, hint?: string, error?: string) {
  const generated = useId();
  const controlId = id ?? generated;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return { controlId, hintId, errorId, describedBy };
}

function FieldShell({
  controlId,
  hintId,
  errorId,
  label,
  hint,
  error,
  required,
  children,
}: FieldOwnProps & {
  controlId: string;
  hintId?: string;
  errorId?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={controlId} className="text-sm font-semibold text-ink">
        {label}
        {required && (
          <span className="text-danger" aria-hidden>
            {" "}
            *
          </span>
        )}
      </label>
      {children}
      {hint && (
        <p id={hintId} className="text-sm text-ink-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextField({
  label,
  hint,
  error,
  id,
  className,
  ...props
}: FieldOwnProps & ComponentProps<"input">) {
  const ids = useFieldIds(id, hint, error);
  return (
    <FieldShell {...ids} label={label} hint={hint} error={error} required={props.required}>
      <input
        {...props}
        id={ids.controlId}
        aria-invalid={error ? true : undefined}
        aria-describedby={ids.describedBy}
        className={cn(
          controlClasses,
          "h-11",
          error ? "border-danger" : "border-border-strong",
          className,
        )}
      />
    </FieldShell>
  );
}

export function TextAreaField({
  label,
  hint,
  error,
  id,
  className,
  rows = 4,
  ...props
}: FieldOwnProps & ComponentProps<"textarea">) {
  const ids = useFieldIds(id, hint, error);
  return (
    <FieldShell {...ids} label={label} hint={hint} error={error} required={props.required}>
      <textarea
        {...props}
        rows={rows}
        id={ids.controlId}
        aria-invalid={error ? true : undefined}
        aria-describedby={ids.describedBy}
        className={cn(
          controlClasses,
          "py-2.5",
          error ? "border-danger" : "border-border-strong",
          className,
        )}
      />
    </FieldShell>
  );
}

export function SelectField({
  label,
  hint,
  error,
  id,
  className,
  children,
  ...props
}: FieldOwnProps & ComponentProps<"select">) {
  const ids = useFieldIds(id, hint, error);
  return (
    <FieldShell {...ids} label={label} hint={hint} error={error} required={props.required}>
      <div className="relative">
        <select
          {...props}
          id={ids.controlId}
          aria-invalid={error ? true : undefined}
          aria-describedby={ids.describedBy}
          className={cn(
            controlClasses,
            "h-11 appearance-none pr-10",
            error ? "border-danger" : "border-border-strong",
            className,
          )}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-muted"
          aria-hidden
        />
      </div>
    </FieldShell>
  );
}
