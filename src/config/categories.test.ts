import { describe, expect, it } from "vitest";
import { categories } from "./categories";

describe("categories", () => {
  it("has the nine categories from the product brief", () => {
    expect(categories).toHaveLength(9);
  });

  it("uses unique, URL-safe slugs", () => {
    const slugs = categories.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z]+(-[a-z]+)*$/);
  });
});
