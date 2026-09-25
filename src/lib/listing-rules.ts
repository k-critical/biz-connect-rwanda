import { z } from "zod";
import { categories } from "@/config/categories";
import { normalizePhone } from "./phone";

/** Limits shared by the forms (to guide people) and the server (to enforce them). */
export const LISTING_LIMITS = {
  name: 80,
  tagline: 120,
  descriptionMin: 40,
  description: 1500,
  extraCategories: 2,
  sector: 60,
  address: 160,
  photos: 12,
  altText: 150,
  periodsPerDay: 3,
  showcaseSections: 10,
  showcaseItemsPerSection: 40,
  listingsPerOwner: 10,
} as const;

/** A generous box around Rwanda, so a map pin can't land in another country by accident. */
export const RWANDA_BOUNDS = { south: -2.9, north: -1.0, west: 28.8, east: 30.95 } as const;

const categorySlugs = categories.map((c) => c.slug) as [string, ...string[]];

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((value) => value || null);

// ---------------------------------------------------------------------------------------------
// Step 1: the basics

export const detailsSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Enter the business name.")
      .max(LISTING_LIMITS.name, `Keep the name under ${LISTING_LIMITS.name} characters.`),
    tagline: z
      .string()
      .trim()
      .min(10, "Write a short line (at least 10 characters) about what you offer.")
      .max(LISTING_LIMITS.tagline, `Keep this under ${LISTING_LIMITS.tagline} characters.`),
    description: z
      .string()
      .trim()
      .min(
        LISTING_LIMITS.descriptionMin,
        `Tell visitors a bit more (at least ${LISTING_LIMITS.descriptionMin} characters).`,
      )
      .max(
        LISTING_LIMITS.description,
        `Keep the description under ${LISTING_LIMITS.description} characters.`,
      ),
    category: z.enum(categorySlugs, "Choose the category that fits best."),
    extraCategories: z.array(z.enum(categorySlugs)).default([]),
    district: z.string().trim().min(1, "Choose the district the business is in."),
    priceLevel: z
      .enum(["", "1", "2", "3"], "Choose a price level.")
      .transform((value) => (value ? Number(value) : null)),
  })
  .transform((value) => ({
    ...value,
    // Extra categories never repeat the main one, and at most two are kept.
    extraCategories: [...new Set(value.extraCategories)]
      .filter((slug) => slug !== value.category)
      .slice(0, LISTING_LIMITS.extraCategories),
  }));

export type DetailsInput = z.infer<typeof detailsSchema>;

// ---------------------------------------------------------------------------------------------
// Step 2: contact and location

const phoneField = z
  .string()
  .trim()
  .transform((value, ctx) => {
    if (!value) return null;
    const phone = normalizePhone(value);
    if (!phone) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a phone number like 0788 123 456, or +country code for other countries.",
      });
      return z.NEVER;
    }
    return phone;
  });

/** Adds https:// when missing, and only accepts http(s) addresses (optionally on given sites). */
export function normalizeWebUrl(input: string, allowedHosts?: string[]): string | null {
  const value = input.trim();
  if (!value) return null;
  const withScheme = /^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (!url.hostname.includes(".") || url.username || url.password) return null;
  if (allowedHosts) {
    const host = url.hostname.replace(/^(www|m)\./, "");
    if (!allowedHosts.some((allowed) => host === allowed || host.endsWith(`.${allowed}`))) {
      return null;
    }
  }
  return url.toString();
}

const urlField = (message: string, allowedHosts?: string[], handleBase?: string) =>
  z
    .string()
    .trim()
    .max(300, "That address is too long.")
    .transform((value, ctx) => {
      if (!value) return null;
      // "@kigalicafe" → the full profile address.
      const handle = handleBase && /^@[\w.]{1,30}$/.test(value) ? value.slice(1) : null;
      const url = normalizeWebUrl(handle ? `${handleBase}${handle}` : value, allowedHosts);
      if (!url) {
        ctx.addIssue({ code: "custom", message });
        return z.NEVER;
      }
      return url;
    });

const coordinate = (min: number, max: number) =>
  z
    .string()
    .trim()
    .transform((value, ctx) => {
      if (!value) return null;
      const number = Number(value);
      if (!Number.isFinite(number) || number < min || number > max) {
        ctx.addIssue({ code: "custom", message: "The map pin must be inside Rwanda." });
        return z.NEVER;
      }
      return Math.round(number * 1e6) / 1e6;
    });

export const contactSchema = z
  .object({
    sector: optionalText(LISTING_LIMITS.sector, "Keep the sector name short."),
    address: optionalText(LISTING_LIMITS.address, "Keep the directions under 160 characters."),
    latitude: coordinate(RWANDA_BOUNDS.south, RWANDA_BOUNDS.north),
    longitude: coordinate(RWANDA_BOUNDS.west, RWANDA_BOUNDS.east),
    whatsapp: phoneField,
    phone: phoneField,
    email: z
      .string()
      .trim()
      .max(254)
      .transform((value, ctx) => {
        if (!value) return null;
        if (!z.email().safeParse(value).success) {
          ctx.addIssue({
            code: "custom",
            message: "Enter an email address like name@example.com.",
          });
          return z.NEVER;
        }
        return value.toLowerCase();
      }),
    website: urlField("Enter a web address like example.rw."),
    facebookUrl: urlField("Enter a Facebook page address.", ["facebook.com", "fb.com"]),
    instagramUrl: urlField(
      "Enter an Instagram address or @name.",
      ["instagram.com"],
      "https://www.instagram.com/",
    ),
  })
  .superRefine((value, ctx) => {
    if ((value.latitude === null) !== (value.longitude === null)) {
      ctx.addIssue({ code: "custom", path: ["latitude"], message: "Place the pin again." });
    }
    if (!value.whatsapp && !value.phone && !value.email) {
      ctx.addIssue({
        code: "custom",
        path: ["whatsapp"],
        message: "Add at least one way to reach you: WhatsApp, phone or email.",
      });
    }
  });

export type ContactInput = z.infer<typeof contactSchema>;

// ---------------------------------------------------------------------------------------------
// Step 3: opening hours

const MINUTES_PER_DAY = 24 * 60;

const periodSchema = z
  .object({
    dayOfWeek: z.int().min(1).max(7),
    opensAt: z
      .int()
      .min(0)
      .max(MINUTES_PER_DAY - 1),
    closesAt: z.int().min(0).max(MINUTES_PER_DAY),
  })
  .refine((p) => p.closesAt !== MINUTES_PER_DAY || p.opensAt === 0, "Invalid closing time.")
  .refine((p) => p.closesAt !== p.opensAt, "Opening and closing times can't be the same.");

export type HoursPeriodInput = z.infer<typeof periodSchema>;

/** Where a period ends on its own day: overnight periods run to midnight. */
const endOnDay = (p: HoursPeriodInput) => (p.closesAt > p.opensAt ? p.closesAt : MINUTES_PER_DAY);

export const hoursSchema = z
  .array(periodSchema)
  .max(7 * LISTING_LIMITS.periodsPerDay)
  .superRefine((periods, ctx) => {
    for (let day = 1; day <= 7; day++) {
      const today = periods
        .filter((p) => p.dayOfWeek === day)
        .sort((a, b) => a.opensAt - b.opensAt);
      if (today.length > LISTING_LIMITS.periodsPerDay) {
        ctx.addIssue({ code: "custom", message: "At most three opening times per day." });
        return;
      }
      for (let i = 1; i < today.length; i++) {
        if (today[i]!.opensAt < endOnDay(today[i - 1]!)) {
          ctx.addIssue({ code: "custom", message: "Opening times on the same day overlap." });
          return;
        }
      }
      // A late-night period from the day before must end before today's first opening.
      const spill = periods.find(
        (p) => p.dayOfWeek === (day === 1 ? 7 : day - 1) && p.closesAt < p.opensAt,
      );
      if (spill && today[0] && today[0].opensAt < spill.closesAt) {
        ctx.addIssue({
          code: "custom",
          message: "A late-night closing time runs into the next day's opening time.",
        });
        return;
      }
    }
  });

// ---------------------------------------------------------------------------------------------
// Menu, products or services

export const showcaseSchema = z
  .array(
    z.object({
      title: z
        .string()
        .trim()
        .min(1, "Give each section a title, like “Drinks” or “Rooms”.")
        .max(60, "Keep section titles under 60 characters."),
      items: z
        .array(
          z.object({
            name: z
              .string()
              .trim()
              .min(1, "Every item needs a name.")
              .max(80, "Keep item names under 80 characters."),
            description: optionalText(200, "Keep item descriptions under 200 characters."),
            priceRwf: z
              .int("Prices are whole Rwandan francs.")
              .min(0, "Prices can't be negative.")
              .max(100_000_000, "That price looks too high.")
              .nullable(),
          }),
        )
        .min(1, "Add at least one item to each section, or remove the empty section.")
        .max(
          LISTING_LIMITS.showcaseItemsPerSection,
          `At most ${LISTING_LIMITS.showcaseItemsPerSection} items per section.`,
        ),
    }),
  )
  .max(LISTING_LIMITS.showcaseSections, `At most ${LISTING_LIMITS.showcaseSections} sections.`);

export type ShowcaseInput = z.infer<typeof showcaseSchema>;

// ---------------------------------------------------------------------------------------------
// Photos and claims

export const altTextSchema = z
  .string()
  .trim()
  .max(LISTING_LIMITS.altText, `Keep the description under ${LISTING_LIMITS.altText} characters.`);

export const CLAIM_RELATIONSHIPS = [
  "Owner",
  "Manager",
  "Staff, with the owner's permission",
] as const;

export const claimSchema = z.object({
  relationship: z.enum(CLAIM_RELATIONSHIPS, "Choose how you're connected to the business."),
  contactPhone: z
    .string()
    .trim()
    .transform((value, ctx) => {
      const phone = normalizePhone(value);
      if (!phone) {
        ctx.addIssue({ code: "custom", message: "Enter a phone number we can call you on." });
        return z.NEVER;
      }
      return phone;
    }),
  message: z
    .string()
    .trim()
    .min(20, "Tell us a little more (at least 20 characters).")
    .max(1000, "Keep the message under 1000 characters."),
});

export type ClaimInput = z.infer<typeof claimSchema>;

/** The first message for each field, for showing under form inputs. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    result[key] ??= issue.message;
  }
  return result;
}
