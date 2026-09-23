import { describe, expect, it } from "vitest";
import { categories } from "../../src/config/categories";
import { demoBusinesses } from "./demo-businesses";
import { districtSlug, provinces } from "./locations";

const allDistricts: string[] = provinces.flatMap((p) => p.districts);

describe("locations", () => {
  it("lists 5 provinces and 30 districts", () => {
    expect(provinces).toHaveLength(5);
    expect(allDistricts).toHaveLength(30);
  });

  it("never lists a district twice", () => {
    const slugs = allDistricts.map(districtSlug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe("demo businesses", () => {
  const categorySlugs = new Set<string>(categories.map((c) => c.slug));

  it("has about twenty, all clearly named as demos", () => {
    expect(demoBusinesses.length).toBeGreaterThanOrEqual(18);
    for (const b of demoBusinesses) expect(b.name.startsWith("Demo ")).toBe(true);
  });

  it("uses unique slugs that start with demo-", () => {
    const slugs = demoBusinesses.map((b) => b.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^demo-[a-z0-9-]+$/);
  });

  it("only points at real districts and categories", () => {
    for (const b of demoBusinesses) {
      expect(allDistricts, b.slug).toContain(b.district);
      expect(new Set(b.categories).size, b.slug).toBe(b.categories.length);
      for (const c of b.categories) expect(categorySlugs.has(c), `${b.slug}: ${c}`).toBe(true);
    }
  });

  it("uses every category at least once, so each category page has something to show", () => {
    const used = new Set<string>(demoBusinesses.flatMap((b) => b.categories));
    expect([...categorySlugs].filter((c) => !used.has(c))).toEqual([]);
  });

  it("has valid opening hours", () => {
    for (const b of demoBusinesses) {
      for (const [day, periods] of Object.entries(b.hours)) {
        expect(Number(day), b.slug).toBeGreaterThanOrEqual(1);
        expect(Number(day), b.slug).toBeLessThanOrEqual(7);
        for (const [opens, closes] of periods ?? []) {
          expect(opens, b.slug).toBeGreaterThanOrEqual(0);
          expect(opens, b.slug).toBeLessThan(24 * 60);
          expect(closes, b.slug).toBeGreaterThan(0);
          expect(closes, b.slug).toBeLessThanOrEqual(24 * 60);
          expect(closes, b.slug).not.toBe(opens);
        }
      }
    }
  });

  it("includes pending and draft listings for testing review flows", () => {
    const statuses = new Set(demoBusinesses.map((b) => b.status));
    expect(statuses).toEqual(new Set(["APPROVED", "PENDING", "DRAFT"]));
  });
});
