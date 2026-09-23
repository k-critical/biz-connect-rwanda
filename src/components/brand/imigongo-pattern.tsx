import { cn } from "@/lib/cn";

// Stacked chevrons, after the zigzag bands of Imigongo panels. Used as a mask so the
// pattern takes its colour from the element's text colour (e.g. `text-border`).
const CHEVRON_TILE = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="16" viewBox="0 0 24 16"><path d="M0 16 12 4 24 16h-6l-6-6-6 6z"/></svg>',
)}")`;

export function ImigongoPattern({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("bg-current", className)}
      style={{
        maskImage: CHEVRON_TILE,
        WebkitMaskImage: CHEVRON_TILE,
        maskSize: "24px 16px",
        WebkitMaskSize: "24px 16px",
      }}
    />
  );
}
