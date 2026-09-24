import type { ReactNode } from "react";

export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-border bg-surface p-6 shadow-lift sm:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">{title}</h1>
        {description && <p className="text-ink-muted">{description}</p>}
      </div>
      {children}
      {footer && <div className="border-t border-border pt-5 text-sm text-ink-muted">{footer}</div>}
    </div>
  );
}
