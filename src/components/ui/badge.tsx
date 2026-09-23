import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "primary" | "accent" | "success" | "danger";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-surface-2 text-ink-muted",
  primary: "bg-primary text-on-primary",
  accent: "bg-accent text-on-accent",
  success: "bg-success text-on-success",
  danger: "bg-danger text-on-danger",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold [&_svg]:size-3",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
