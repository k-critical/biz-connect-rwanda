import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  headingLevel = 2,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  headingLevel?: 1 | 2 | 3;
}) {
  const Heading = `h${headingLevel}` as const;
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-surface-2 text-ink-muted">
        <Icon className="size-6" aria-hidden />
      </span>
      <Heading className="text-xl font-bold">{title}</Heading>
      {description && <p className="max-w-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
