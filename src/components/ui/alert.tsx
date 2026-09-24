import type { ReactNode } from "react";
import { CircleAlert, CircleCheck, Info } from "lucide-react";
import { cn } from "@/lib/cn";

const tones = {
  error: { icon: CircleAlert, classes: "border-danger/40 bg-danger/10", iconColor: "text-danger" },
  success: {
    icon: CircleCheck,
    classes: "border-success/40 bg-success/10",
    iconColor: "text-success",
  },
  info: { icon: Info, classes: "border-border-strong bg-surface-2", iconColor: "text-ink-muted" },
} as const;

export function Alert({
  tone = "info",
  children,
  className,
}: {
  tone?: keyof typeof tones;
  children: ReactNode;
  className?: string;
}) {
  const { icon: Icon, classes, iconColor } = tones[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-xl border px-4 py-3 text-sm text-ink", classes, className)}
    >
      <Icon className={cn("mt-0.5 size-4 shrink-0", iconColor)} aria-hidden />
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}
