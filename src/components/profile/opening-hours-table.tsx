import type { BusinessProfile } from "@/server/services/directory-service";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

type Business = BusinessProfile["business"];

export function OpeningHoursTable({
  schedule,
  today,
}: {
  schedule: Business["schedule"];
  today: number;
}) {
  if (schedule.every((d) => d.ranges.length === 0)) {
    return <p className="text-ink-muted">Opening hours haven&apos;t been listed yet.</p>;
  }
  return (
    <table className="w-full text-sm">
      <caption className="sr-only">Opening hours, Kigali time</caption>
      <tbody>
        {schedule.map((d) => {
          const isToday = d.day === today;
          return (
            <tr
              key={d.day}
              aria-current={isToday ? "date" : undefined}
              className={cn("border-b border-border last:border-0", isToday && "bg-surface-2")}
            >
              <th scope="row" className="py-2.5 pl-3 text-left font-semibold">
                <span className="inline-flex items-center gap-2">
                  {d.name}
                  {isToday && <Badge tone="primary">Today</Badge>}
                </span>
              </th>
              <td
                className={cn(
                  "py-2.5 pr-3 text-right tabular-nums",
                  d.ranges.length === 0 ? "text-ink-muted" : "text-ink",
                  isToday && "font-semibold",
                )}
              >
                {d.ranges.length > 0 ? d.ranges.join(", ") : "Closed"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
