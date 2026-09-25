import { describe, expect, it } from "vitest";
import {
  claimSchema,
  contactSchema,
  detailsSchema,
  fieldErrors,
  hoursSchema,
  normalizeWebUrl,
  showcaseSchema,
} from "./listing-rules";

const validDetails = {
  name: "  Demo Brochette Corner ",
  tagline: "Goat brochettes and fresh juice",
  description: "A small family grill near the market, open late. Cash and MoMo accepted.",
  category: "restaurants",
  extraCategories: [],
  district: "gasabo",
  priceLevel: "1",
};

const emptyContact = {
  sector: "",
  address: "",
  latitude: "",
  longitude: "",
  whatsapp: "",
  phone: "",
  email: "",
  website: "",
  facebookUrl: "",
  instagramUrl: "",
};

describe("detailsSchema", () => {
  it("accepts a complete listing and tidies it", () => {
    const result = detailsSchema.parse(validDetails);
    expect(result.name).toBe("Demo Brochette Corner");
    expect(result.priceLevel).toBe(1);
  });

  it("treats an empty price as not listed", () => {
    expect(detailsSchema.parse({ ...validDetails, priceLevel: "" }).priceLevel).toBeNull();
  });

  it("drops the main category and duplicates from the extras, keeping two", () => {
    const result = detailsSchema.parse({
      ...validDetails,
      extraCategories: ["restaurants", "hotels", "hotels", "entertainment", "shops"],
    });
    expect(result.extraCategories).toEqual(["hotels", "entertainment"]);
  });

  it("explains each missing or wrong field", () => {
    const result = detailsSchema.safeParse({
      ...validDetails,
      name: "A",
      description: "Too short",
      category: "banks",
      priceLevel: "4",
    });
    expect(result.success).toBe(false);
    const errors = fieldErrors(result.error!);
    expect(Object.keys(errors).sort()).toEqual(["category", "description", "name", "priceLevel"]);
    expect(errors["description"]).toMatch(/at least 40/);
  });
});

describe("contactSchema", () => {
  it("needs at least one way to get in touch", () => {
    const result = contactSchema.safeParse(emptyContact);
    expect(result.success).toBe(false);
    expect(fieldErrors(result.error!)["whatsapp"]).toMatch(/at least one way/);
  });

  it("normalises numbers, email and links", () => {
    const result = contactSchema.parse({
      ...emptyContact,
      whatsapp: "0788 123 456",
      email: "Hello@Example.RW",
      website: "example.rw",
      instagramUrl: "@demo.cafe",
      facebookUrl: "https://m.facebook.com/democafe",
    });
    expect(result).toMatchObject({
      whatsapp: "+250788123456",
      phone: null,
      email: "hello@example.rw",
      website: "https://example.rw/",
      instagramUrl: "https://www.instagram.com/demo.cafe",
      facebookUrl: "https://m.facebook.com/democafe",
      sector: null,
    });
  });

  it("refuses links that aren't what they claim to be", () => {
    const result = contactSchema.safeParse({
      ...emptyContact,
      phone: "0788123456",
      website: "javascript:alert(1)",
      facebookUrl: "https://evil.example/facebook.com",
      instagramUrl: "https://facebook.com/someone",
    });
    expect(result.success).toBe(false);
    expect(Object.keys(fieldErrors(result.error!)).sort()).toEqual([
      "facebookUrl",
      "instagramUrl",
      "website",
    ]);
  });

  it("keeps map pins inside Rwanda, with both numbers", () => {
    const base = { ...emptyContact, phone: "0788123456" };
    expect(
      contactSchema.parse({ ...base, latitude: "-1.944123", longitude: "30.061987" }),
    ).toMatchObject({ latitude: -1.944123, longitude: 30.061987 });
    expect(contactSchema.safeParse({ ...base, latitude: "51.5", longitude: "-0.12" }).success).toBe(
      false,
    );
    expect(contactSchema.safeParse({ ...base, latitude: "-1.94", longitude: "" }).success).toBe(
      false,
    );
  });
});

describe("normalizeWebUrl", () => {
  it.each([
    ["example.rw", "https://example.rw/"],
    ["http://example.rw/menu", "http://example.rw/menu"],
    ["ftp://example.rw", null],
    ["https://user:pass@example.rw", null],
    ["localhost", null],
    ["", null],
  ])("%s → %s", (input, expected) => {
    expect(normalizeWebUrl(input)).toBe(expected);
  });
});

describe("hoursSchema", () => {
  const period = (dayOfWeek: number, opensAt: number, closesAt: number) => ({
    dayOfWeek,
    opensAt,
    closesAt,
  });

  it("accepts ordinary, split, all-day and late-night hours", () => {
    expect(
      hoursSchema.safeParse([
        period(1, 8 * 60, 12 * 60),
        period(1, 14 * 60, 18 * 60),
        period(2, 0, 24 * 60),
        period(5, 18 * 60, 2 * 60),
        period(6, 10 * 60, 23 * 60),
      ]).success,
    ).toBe(true);
    expect(hoursSchema.safeParse([]).success).toBe(true);
  });

  it("rejects overlapping times on the same day", () => {
    const result = hoursSchema.safeParse([period(1, 8 * 60, 13 * 60), period(1, 12 * 60, 18 * 60)]);
    expect(result.error?.issues[0]?.message).toMatch(/overlap/);
  });

  it("rejects a late night that runs into the next morning's opening", () => {
    const result = hoursSchema.safeParse([period(5, 20 * 60, 3 * 60), period(6, 2 * 60, 10 * 60)]);
    expect(result.error?.issues[0]?.message).toMatch(/next day/);
  });

  it("rejects impossible times", () => {
    expect(hoursSchema.safeParse([period(8, 60, 120)]).success).toBe(false);
    expect(hoursSchema.safeParse([period(1, 600, 600)]).success).toBe(false);
    expect(hoursSchema.safeParse([period(1, 600, 24 * 60)]).success).toBe(false);
    expect(hoursSchema.safeParse("not a list").success).toBe(false);
  });

  it("allows at most three times a day", () => {
    const four = [0, 1, 2, 3].map((i) => period(3, i * 120, i * 120 + 60));
    expect(hoursSchema.safeParse(four).success).toBe(false);
  });
});

describe("showcaseSchema", () => {
  it("accepts sections with optional prices and descriptions", () => {
    const result = showcaseSchema.parse([
      {
        title: " Drinks ",
        items: [
          { name: "Passion juice", description: "", priceRwf: 1500 },
          { name: "Tea", description: "With ginger", priceRwf: null },
        ],
      },
    ]);
    expect(result[0]).toEqual({
      title: "Drinks",
      items: [
        { name: "Passion juice", description: null, priceRwf: 1500 },
        { name: "Tea", description: "With ginger", priceRwf: null },
      ],
    });
  });

  it("rejects empty sections, nameless items and odd prices", () => {
    expect(showcaseSchema.safeParse([{ title: "Food", items: [] }]).success).toBe(false);
    expect(
      showcaseSchema.safeParse([
        { title: "Food", items: [{ name: " ", description: "", priceRwf: 1 }] },
      ]).success,
    ).toBe(false);
    expect(
      showcaseSchema.safeParse([
        { title: "Food", items: [{ name: "Rice", description: "", priceRwf: -1 }] },
      ]).success,
    ).toBe(false);
    expect(
      showcaseSchema.safeParse([
        { title: "Food", items: [{ name: "Rice", description: "", priceRwf: 99.5 }] },
      ]).success,
    ).toBe(false);
  });
});

describe("claimSchema", () => {
  it("accepts a real request and normalises the phone number", () => {
    expect(
      claimSchema.parse({
        relationship: "Owner",
        contactPhone: "0788 123 456",
        message: "I opened this café in 2019 and run it with my sister.",
      }).contactPhone,
    ).toBe("+250788123456");
  });

  it("needs a relationship, a callable number and a real message", () => {
    const result = claimSchema.safeParse({
      relationship: "Cousin",
      contactPhone: "x",
      message: "hi",
    });
    expect(Object.keys(fieldErrors(result.error!)).sort()).toEqual([
      "contactPhone",
      "message",
      "relationship",
    ]);
  });
});
