"use client";

import { useState } from "react";
import { Copy, Plus, X } from "lucide-react";
import { LISTING_LIMITS } from "@/lib/listing-rules";
import { DAY_NAMES, formatTime, type HoursPeriod } from "@/lib/opening-hours";
import { saveHoursAction } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { FormMessage } from "./form-message";
import { useFormAction } from "./use-form-action";

type Period = { opens: string; closes: string };
type Day = { open: boolean; allDay: boolean; periods: Period[] };

const DEFAULT_PERIOD: Period = { opens: "08:00", closes: "18:00" };
const MINUTES_PER_DAY = 24 * 60;

function toMinutes(time: string): number {
  const [hours = "0", minutes = "0"] = time.split(":");
  return Number(hours) * 60 + Number(minutes);
}

function initialDays(periods: HoursPeriod[]): Day[] {
  return DAY_NAMES.map((_, index) => {
    const mine = periods
      .filter((p) => p.dayOfWeek === index + 1)
      .sort((a, b) => a.opensAt - b.opensAt);
    const allDay = mine.some((p) => p.opensAt === 0 && p.closesAt === MINUTES_PER_DAY);
    return {
      open: mine.length > 0,
      allDay,
      periods:
        mine.length > 0 && !allDay
          ? mine.map((p) => ({ opens: formatTime(p.opensAt), closes: formatTime(p.closesAt) }))
          : [DEFAULT_PERIOD],
    };
  });
}

function serialize(days: Day[]) {
  return days.flatMap((day, index) => {
    if (!day.open) return [];
    if (day.allDay) return [{ dayOfWeek: index + 1, opensAt: 0, closesAt: MINUTES_PER_DAY }];
    return day.periods
      .filter((p) => p.opens && p.closes)
      .map((p) => ({
        dayOfWeek: index + 1,
        opensAt: toMinutes(p.opens),
        closesAt: toMinutes(p.closes),
      }));
  });
}

const timeInput =
  "h-11 w-full min-w-0 rounded-lg border border-border-strong bg-surface px-3 text-base text-ink sm:w-32";

export function HoursForm({
  mode,
  businessId,
  defaults,
}: {
  mode: "wizard" | "edit";
  businessId: string;
  defaults: HoursPeriod[];
}) {
  const { state, pending, onSubmit, formRef } = useFormAction(saveHoursAction);
  const [days, setDays] = useState<Day[]>(() => initialDays(defaults));

  const update = (index: number, change: (day: Day) => Day) =>
    setDays((current) => current.map((day, i) => (i === index ? change(day) : day)));

  const setPeriod = (dayIndex: number, periodIndex: number, field: keyof Period, value: string) =>
    update(dayIndex, (day) => ({
      ...day,
      periods: day.periods.map((p, i) => (i === periodIndex ? { ...p, [field]: value } : p)),
    }));

  const copyFirstOpenDay = () => {
    const source = days.find((day) => day.open);
    if (!source) return;
    setDays((current) =>
      current.map(() => ({ ...source, periods: source.periods.map((p) => ({ ...p })) })),
    );
  };

  return (
    <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-6">
      <FormMessage state={state} />
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="hours" value={JSON.stringify(serialize(days))} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-prose text-sm text-ink-muted">
          Tick the days you&apos;re open. Closing after midnight? Enter the time it closes, e.g.
          02:00. Times are Kigali time.
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={copyFirstOpenDay}
          disabled={!days.some((d) => d.open)}
        >
          <Copy aria-hidden /> Same hours every day
        </Button>
      </div>

      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
        {days.map((day, dayIndex) => {
          const name = DAY_NAMES[dayIndex]!;
          return (
            <li
              key={name}
              className={cn(
                "flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:gap-6",
                !day.open && "bg-surface-2/60",
              )}
            >
              <label className="flex w-40 shrink-0 cursor-pointer items-center gap-3 pt-2.5 font-semibold">
                <input
                  type="checkbox"
                  checked={day.open}
                  onChange={(event) =>
                    update(dayIndex, (d) => ({ ...d, open: event.target.checked }))
                  }
                  className="size-5 accent-primary"
                />
                {name}
              </label>

              {day.open ? (
                <div className="flex flex-1 flex-col gap-3">
                  <label className="inline-flex w-fit cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={day.allDay}
                      onChange={(event) =>
                        update(dayIndex, (d) => ({ ...d, allDay: event.target.checked }))
                      }
                      className="size-4 accent-primary"
                    />
                    Open 24 hours
                  </label>

                  {!day.allDay &&
                    day.periods.map((period, periodIndex) => (
                      <div key={periodIndex} className="flex items-center gap-2">
                        <input
                          type="time"
                          required
                          value={period.opens}
                          aria-label={`${name}, opens at`}
                          onChange={(e) =>
                            setPeriod(dayIndex, periodIndex, "opens", e.target.value)
                          }
                          className={timeInput}
                        />
                        <span aria-hidden className="text-ink-muted">
                          to
                        </span>
                        <input
                          type="time"
                          required
                          value={period.closes}
                          aria-label={`${name}, closes at`}
                          onChange={(e) =>
                            setPeriod(dayIndex, periodIndex, "closes", e.target.value)
                          }
                          className={timeInput}
                        />
                        {day.periods.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={`Remove this ${name} time`}
                            onClick={() =>
                              update(dayIndex, (d) => ({
                                ...d,
                                periods: d.periods.filter((_, i) => i !== periodIndex),
                              }))
                            }
                          >
                            <X aria-hidden />
                          </Button>
                        )}
                      </div>
                    ))}

                  {!day.allDay && day.periods.length < LISTING_LIMITS.periodsPerDay && (
                    <button
                      type="button"
                      onClick={() =>
                        update(dayIndex, (d) => ({
                          ...d,
                          periods: [...d.periods, { opens: "", closes: "" }],
                        }))
                      }
                      className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                    >
                      <Plus className="size-4" aria-hidden /> Add a second time, e.g. after a lunch
                      break
                    </button>
                  )}
                </div>
              ) : (
                <p className="pt-2.5 text-sm text-ink-muted">Closed</p>
              )}
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap gap-3 border-t border-border pt-6">
        <Button type="submit" size="lg" loading={pending}>
          {mode === "edit" ? "Save hours" : "Save and continue"}
        </Button>
      </div>
    </form>
  );
}
