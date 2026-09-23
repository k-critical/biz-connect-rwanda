// Runs against the real database, seeded with the demo businesses (`npm run db:seed`).
import { afterAll, describe, expect, it } from "vitest";
import { demoBusinesses, type DemoBusiness } from "../../../prisma/seed-data/demo-businesses";
import { parseExploreParams, type RawSearchParams } from "@/lib/explore-params";
import { isOpenAt, type HoursPeriod } from "@/lib/opening-hours";
import { db } from "@/server/db";
import { getBusinessProfile, searchDirectory } from "./directory-service";

afterAll(() => db.$disconnect());

// Kigali is UTC+2 all year. 21 September 2026 is a Monday.
const kigali = (day: number, time: string) => {
  const [h, m] = time.split(":").map(Number);
  return new Date(Date.UTC(2026, 8, 20 + day, h - 2, m));
};

const periodsOf = (b: DemoBusiness): HoursPeriod[] =>
  Object.entries(b.hours).flatMap(([day, periods]) =>
    (periods ?? []).map(([opensAt, closesAt]) => ({ dayOfWeek: Number(day), opensAt, closesAt })),
  );

const approvedDemos = demoBusinesses.filter((b) => b.status === "APPROVED");

async function demoSlugs(params: RawSearchParams, now = new Date()) {
  const slugs: string[] = [];
  for (let page = 1; ; page++) {
    const result = await searchDirectory(
      parseExploreParams({ ...params, page: String(page) }),
      now,
    );
    slugs.push(...result.items.map((item) => item.slug));
    if (page >= result.pageCount) break;
  }
  return slugs.filter((slug) => slug.startsWith("demo-"));
}

describe("search", () => {
  it("puts the best name match first", async () => {
    expect((await demoSlugs({ q: "grill" }))[0]).toBe("demo-grill-house");
  });

  it("matches words from the category and district, not just the name", async () => {
    expect(await demoSlugs({ q: "hotel Musanze" })).toContain("demo-volcano-view-lodge");
  });

  it("forgives partial words and small typos", async () => {
    expect(await demoSlugs({ q: "gril" })).toContain("demo-grill-house");
    expect(await demoSlugs({ q: "Lakside" })).toContain("demo-lakeside-guesthouse");
  });

  it("never returns listings that aren't approved", async () => {
    expect(await demoSlugs({ q: "pharmacy" })).not.toContain("demo-pharmacy");
    expect(await getBusinessProfile("demo-pharmacy")).toBeNull();
  });
});

describe("filters", () => {
  it("filters by category", async () => {
    const expected = approvedDemos
      .filter((b) => b.categories.includes("hotels"))
      .map((b) => b.slug);
    expect((await demoSlugs({ category: "hotels" })).sort()).toEqual(expected.sort());
  });

  it("filters by district", async () => {
    const expected = approvedDemos.filter((b) => b.district === "Gasabo").map((b) => b.slug);
    expect((await demoSlugs({ district: "gasabo" })).sort()).toEqual(expected.sort());
  });

  it.each([
    ["Monday 10:00", kigali(1, "10:00")],
    ["Wednesday 01:30, after midnight", kigali(3, "01:30")],
    ["Tuesday 01:30, the bar's day off", kigali(2, "01:30")],
    ["Sunday 06:30", kigali(7, "06:30")],
    ["Saturday 23:30", kigali(6, "23:30")],
  ])("'open now' in the database agrees with the code on %s", async (_label, now) => {
    const expected = approvedDemos.filter((b) => isOpenAt(periodsOf(b), now)).map((b) => b.slug);
    expect((await demoSlugs({ open: "1" }, now)).sort()).toEqual(expected.sort());
  });
});

describe("business profile", () => {
  it("returns hours, showcase prices and related businesses", async () => {
    const profile = await getBusinessProfile("demo-grill-house", kigali(1, "12:00"));
    expect(profile).not.toBeNull();
    expect(profile!.business.status.label).toBe("Open now · until 22:00");
    expect(profile!.business.schedule).toHaveLength(7);
    expect(profile!.business.showcase[0].items[0].price).toMatch(/^RWF\s1,500$/);
    expect(profile!.related.map((r) => r.slug)).not.toContain("demo-grill-house");
  });
});
