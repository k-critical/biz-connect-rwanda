import { describe, expect, it } from "vitest";
import { exploreHref, parseExploreParams } from "./explore-params";
import { formatRwf, priceLevelLabel } from "./format";

describe("parseExploreParams", () => {
  it("reads every filter from the URL", () => {
    expect(
      parseExploreParams({
        q: "  grill ",
        category: "restaurants",
        district: "nyarugenge",
        price: "1",
        open: "1",
        sort: "name",
        page: "2",
      }),
    ).toEqual({
      q: "grill",
      category: "restaurants",
      district: "nyarugenge",
      priceLevel: 1,
      openNow: true,
      sort: "name",
      page: 2,
    });
  });

  it("falls back to defaults instead of failing on bad input", () => {
    expect(
      parseExploreParams({
        q: "",
        category: "spaceships",
        district: "<script>",
        price: "9",
        open: "yes",
        sort: "random",
        page: "-3",
      }),
    ).toEqual({ openNow: false, sort: "recommended", page: 1 });
  });

  it("sorts by best match only when there is a search", () => {
    expect(parseExploreParams({ q: "cafe" }).sort).toBe("relevance");
    expect(parseExploreParams({ sort: "relevance" }).sort).toBe("recommended");
  });

  it("uses the first value when a parameter is repeated", () => {
    expect(parseExploreParams({ category: ["hotels", "shops"] }).category).toBe("hotels");
  });
});

describe("exploreHref", () => {
  const filters = parseExploreParams({ q: "hotel", district: "musanze", page: "3" });

  it("leaves defaults out of the URL", () => {
    expect(exploreHref(parseExploreParams({}))).toBe("/explore");
  });

  it("resets to page 1 when a filter changes", () => {
    expect(exploreHref(filters, { district: undefined })).toBe("/explore?q=hotel");
  });

  it("keeps other filters when changing the page", () => {
    expect(exploreHref(filters, { page: 4 })).toBe("/explore?q=hotel&district=musanze&page=4");
  });

  it("builds category-page URLs without repeating the category", () => {
    const onCategory = parseExploreParams({ category: "hotels", open: "1" });
    expect(exploreHref(onCategory, {}, { basePath: "/c/hotels", omitCategory: true })).toBe(
      "/c/hotels?open=1",
    );
  });
});

describe("formatting", () => {
  it("formats prices in Rwandan francs without decimals", () => {
    expect(formatRwf(2500)).toMatch(/^RWF\s2,500$/);
  });

  it("names price levels", () => {
    expect(priceLevelLabel(2)).toBe("Mid-range");
    expect(priceLevelLabel(null)).toBeNull();
  });
});
