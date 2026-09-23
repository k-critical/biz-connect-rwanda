import { Star } from "lucide-react";

export function Rating({ value, count }: { value: number; count?: number }) {
  const score = value.toFixed(1);
  const reviews =
    count === undefined ? "" : `, from ${count} ${count === 1 ? "review" : "reviews"}`;
  return (
    <span
      role="img"
      aria-label={`Rated ${score} out of 5${reviews}`}
      className="inline-flex items-center gap-1 text-sm"
    >
      <Star className="size-4 fill-accent text-accent" aria-hidden />
      <span className="font-semibold text-ink">{score}</span>
      {count !== undefined && <span className="text-ink-muted">({count})</span>}
    </span>
  );
}
