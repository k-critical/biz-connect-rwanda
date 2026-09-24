import { describe, expect, it } from "vitest";
import {
  formatPeriod,
  getOpenStatus,
  isOpenAt,
  kigaliClock,
  weeklySchedule,
  type HoursPeriod,
} from "./opening-hours";

// Kigali is UTC+2 all year. 21 September 2026 is a Monday.
const kigali = (day: number, time: string) => {
  const [h, m] = time.split(":").map(Number);
  return new Date(Date.UTC(2026, 8, 20 + day, h - 2, m));
};

const at = (h: number, m = 0) => h * 60 + m;
const days = (list: number[], opensAt: number, closesAt: number): HoursPeriod[] =>
  list.map((dayOfWeek) => ({ dayOfWeek, opensAt, closesAt }));

const shop = days([1, 2, 3, 4, 5, 6], at(8), at(19));
const lateBar = days([2, 3, 4, 5, 6, 7], at(17), at(2));
const allDay = days([1, 2, 3, 4, 5, 6, 7], 0, at(24));

describe("kigaliClock", () => {
  it("reads the weekday and time on Kigali's clock, not UTC", () => {
    expect(kigaliClock(new Date("2026-09-21T08:30:00Z"))).toEqual({ day: 1, minutes: at(10, 30) });
    expect(kigaliClock(new Date("2026-09-27T23:15:00Z"))).toEqual({ day: 1, minutes: at(1, 15) });
  });
});

describe("isOpenAt", () => {
  it("handles ordinary daytime hours", () => {
    expect(isOpenAt(shop, kigali(1, "10:00"))).toBe(true);
    expect(isOpenAt(shop, kigali(1, "07:59"))).toBe(false);
    expect(isOpenAt(shop, kigali(1, "19:00"))).toBe(false);
    expect(isOpenAt(shop, kigali(7, "12:00"))).toBe(false);
  });

  it("keeps a late-night venue open past midnight", () => {
    expect(isOpenAt(lateBar, kigali(3, "01:30"))).toBe(true);
    expect(isOpenAt(lateBar, kigali(1, "01:30"))).toBe(true);
    expect(isOpenAt(lateBar, kigali(3, "02:00"))).toBe(false);
    expect(isOpenAt(lateBar, kigali(2, "01:30"))).toBe(false);
    expect(isOpenAt(lateBar, kigali(2, "23:59"))).toBe(true);
  });

  it("treats 00:00–24:00 as always open", () => {
    expect(isOpenAt(allDay, kigali(4, "00:00"))).toBe(true);
    expect(isOpenAt(allDay, kigali(4, "23:59"))).toBe(true);
  });
});

describe("getOpenStatus", () => {
  it("says when an open business closes", () => {
    expect(getOpenStatus(shop, kigali(1, "10:00"))).toEqual({
      state: "open",
      label: "Open now · until 19:00",
    });
    expect(getOpenStatus(lateBar, kigali(3, "01:00")).label).toBe("Open now · until 02:00");
    expect(getOpenStatus(allDay, kigali(3, "01:00")).label).toBe("Open 24 hours");
  });

  it("says when a closed business opens next", () => {
    expect(getOpenStatus(shop, kigali(1, "06:00")).label).toBe("Closed · opens 08:00");
    expect(getOpenStatus(shop, kigali(7, "10:00")).label).toBe("Closed · opens tomorrow 08:00");
    expect(getOpenStatus(shop, kigali(6, "20:00")).label).toBe("Closed · opens Mon 08:00");
    expect(getOpenStatus(lateBar, kigali(2, "03:00")).label).toBe("Closed · opens 17:00");
  });

  it("admits it doesn't know when no hours are listed", () => {
    expect(getOpenStatus([], kigali(1, "10:00"))).toEqual({
      state: "unknown",
      label: "Hours not listed",
    });
  });
});

describe("weeklySchedule", () => {
  it("lists all seven days, leaving closed days empty", () => {
    const schedule = weeklySchedule(shop);
    expect(schedule).toHaveLength(7);
    expect(schedule[0]).toEqual({ day: 1, name: "Monday", ranges: ["08:00–19:00"] });
    expect(schedule[6]).toEqual({ day: 7, name: "Sunday", ranges: [] });
  });

  it("formats overnight and all-day periods", () => {
    expect(formatPeriod({ dayOfWeek: 2, opensAt: at(17), closesAt: at(2) })).toBe("17:00–02:00");
    expect(formatPeriod({ dayOfWeek: 2, opensAt: 0, closesAt: at(24) })).toBe("Open 24 hours");
  });
});
