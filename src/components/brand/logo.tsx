import { cn } from "@/lib/cn";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("shrink-0", className)} aria-hidden>
      <rect width="32" height="32" rx="8" fill="var(--primary)" />
      <path
        d="M16 6 26 16 16 26 6 16Z"
        fill="none"
        stroke="var(--on-primary)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M16 11.5 20.5 16 16 20.5 11.5 16Z" fill="var(--accent)" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className="size-8" />
      <span className="font-display text-xl leading-none font-bold text-ink">
        BizConnect<span className="text-primary"> Rwanda</span>
      </span>
    </span>
  );
}
