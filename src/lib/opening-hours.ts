export type HoursPeriod = { dayOfWeek: number; opensAt: number; closesAt: number };

export type OpenStatus = { state: "open" | "closed" | "unknown"; label: string };

export const KIGALI_TIME_ZONE = "Africa/Kigali";

export const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

const SHORT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const MINUTES_PER_DAY = 24 * 60;

const clockFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: KIGALI_TIME_ZONE,
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Weekday (1 = Monday … 7 = Sunday) and minutes after midnight, on Kigali's clock. */
export function kigaliClock(date: Date): { day: number; minutes: number } {
  const parts = clockFormat.formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)!.value;
  const day = SHORT_DAYS.indexOf(part("weekday") as (typeof SHORT_DAYS)[number]) + 1;
  return { day, minutes: Number(part("hour")) * 60 + Number(part("minute")) };
}

export function previousDay(day: number): number {
  return day === 1 ? 7 : day - 1;
}

function isOvernight(period: HoursPeriod): boolean {
  return period.closesAt <= period.opensAt;
}

function isAllDay(period: HoursPeriod): boolean {
  return period.opensAt === 0 && period.closesAt === MINUTES_PER_DAY;
}

export function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60) % 24;
  return `${String(hours).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

export function formatPeriod(period: HoursPeriod): string {
  if (isAllDay(period)) return "Open 24 hours";
  return `${formatTime(period.opensAt)}–${formatTime(period.closesAt)}`;
}

function activePeriod(periods: HoursPeriod[], day: number, minutes: number) {
  return periods.find(
    (p) =>
      (p.dayOfWeek === day && minutes >= p.opensAt && (isOvernight(p) || minutes < p.closesAt)) ||
      (p.dayOfWeek === previousDay(day) && isOvernight(p) && minutes < p.closesAt),
  );
}

export function isOpenAt(periods: HoursPeriod[], date: Date): boolean {
  const { day, minutes } = kigaliClock(date);
  return activePeriod(periods, day, minutes) !== undefined;
}

export function getOpenStatus(periods: HoursPeriod[], date: Date): OpenStatus {
  if (periods.length === 0) return { state: "unknown", label: "Hours not listed" };

  const { day, minutes } = kigaliClock(date);
  const current = activePeriod(periods, day, minutes);
  if (current) {
    return {
      state: "open",
      label: isAllDay(current)
        ? "Open 24 hours"
        : `Open now · until ${formatTime(current.closesAt)}`,
    };
  }

  for (let offset = 0; offset < 7; offset++) {
    const checkDay = ((day - 1 + offset) % 7) + 1;
    const next = periods
      .filter((p) => p.dayOfWeek === checkDay && (offset > 0 || p.opensAt > minutes))
      .sort((a, b) => a.opensAt - b.opensAt)[0];
    if (next) {
      const when = offset === 0 ? "" : offset === 1 ? "tomorrow " : `${SHORT_DAYS[checkDay - 1]} `;
      return { state: "closed", label: `Closed · opens ${when}${formatTime(next.opensAt)}` };
    }
  }
  return { state: "closed", label: "Closed" };
}

export function weeklySchedule(periods: HoursPeriod[]) {
  return DAY_NAMES.map((name, index) => {
    const day = index + 1;
    const ranges = periods
      .filter((p) => p.dayOfWeek === day)
      .sort((a, b) => a.opensAt - b.opensAt)
      .map(formatPeriod);
    return { day, name, ranges };
  });
}
