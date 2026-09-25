import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export const WIZARD_STEPS = [
  { slug: "details", label: "The basics" },
  { slug: "contact", label: "Contact and location" },
  { slug: "hours", label: "Photos and hours" },
  { slug: "review", label: "Review and send" },
] as const;

export type WizardStep = (typeof WIZARD_STEPS)[number]["slug"];

/**
 * Where the owner is in "List your business". Earlier steps stay clickable so details can be
 * changed; later ones open once the draft exists.
 */
export function WizardSteps({ current, businessId }: { current: WizardStep; businessId?: string }) {
  const currentIndex = WIZARD_STEPS.findIndex((step) => step.slug === current);
  return (
    <nav aria-label="Steps">
      <ol className="grid grid-cols-4 gap-2">
        {WIZARD_STEPS.map((step, index) => {
          const state = index < currentIndex ? "done" : index === currentIndex ? "current" : "todo";
          const content = (
            <>
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold",
                  state === "done" && "border-primary bg-primary text-on-primary",
                  state === "current" && "border-primary bg-surface text-primary",
                  state === "todo" && "border-border-strong bg-surface text-ink-muted",
                )}
              >
                {state === "done" ? <Check className="size-4" aria-hidden /> : index + 1}
              </span>
              <span
                className={cn(
                  "hidden text-sm leading-tight sm:block",
                  state === "current" ? "font-semibold text-ink" : "text-ink-muted",
                )}
              >
                {step.label}
              </span>
              <span className="sr-only sm:hidden">{step.label}</span>
              {state === "done" && <span className="sr-only"> (done)</span>}
            </>
          );
          const classes = "flex flex-col items-center gap-2 text-center sm:flex-row sm:text-left";
          return (
            <li
              key={step.slug}
              aria-current={state === "current" ? "step" : undefined}
              className={cn(
                "border-t-4 pt-3",
                state === "todo" ? "border-border" : "border-primary",
              )}
            >
              {businessId && state !== "current" ? (
                <Link
                  href={`/list-your-business/${businessId}/${step.slug}`}
                  className={cn(classes, "rounded-lg hover:opacity-80")}
                >
                  {content}
                </Link>
              ) : (
                <div className={classes}>{content}</div>
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-sm text-ink-muted sm:hidden">
        Step {currentIndex + 1} of {WIZARD_STEPS.length}:{" "}
        <span className="font-semibold text-ink">{WIZARD_STEPS[currentIndex]?.label}</span>
      </p>
    </nav>
  );
}
