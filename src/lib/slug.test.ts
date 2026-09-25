import { describe, expect, it } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it.each([
    ["Demo Café Kigali", "demo-cafe-kigali"],
    ["Rwanda Coffee & Tea", "rwanda-coffee-and-tea"],
    ["  Chez   Lando!! ", "chez-lando"],
    ["Hôtel des Mille Collines", "hotel-des-mille-collines"],
    ["Umuganda-Friendly  Shop", "umuganda-friendly-shop"],
  ])("%s → %s", (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });

  it("never returns an empty slug", () => {
    expect(slugify("!!!")).toBe("business");
    expect(slugify("日本")).toBe("business");
  });

  it("stays short and never ends with a dash", () => {
    const slug = slugify("a ".repeat(100));
    expect(slug.length).toBeLessThanOrEqual(60);
    expect(slug.endsWith("-")).toBe(false);
  });
});
