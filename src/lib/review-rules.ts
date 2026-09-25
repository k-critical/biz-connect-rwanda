import { z } from "zod";

export const reviewSchema = z.object({
  rating: z.coerce
    .number("Choose a star rating.")
    .int("Choose a star rating.")
    .min(1, "Choose a star rating.")
    .max(5, "Choose a star rating."),
  comment: z
    .string()
    .trim()
    .min(10, "Say a little about your visit (at least 10 characters).")
    .max(1000, "Keep your review under 1000 characters."),
});

export type ReviewInput = z.infer<typeof reviewSchema>;

/** An owner's public reply. An empty reply removes it. */
export const replySchema = z
  .string()
  .trim()
  .max(1000, "Keep your reply under 1000 characters.")
  .refine(
    (value) => value === "" || value.length >= 2,
    "Write a reply, or leave it empty to remove it.",
  )
  .transform((value) => value || null);

export const REVIEWS_PER_DAY = 10;

/** Share of each star rating, 5 stars first, for the bar chart on a profile. */
export function ratingBreakdown(counts: Partial<Record<number, number>>) {
  const total = [1, 2, 3, 4, 5].reduce((sum, stars) => sum + (counts[stars] ?? 0), 0);
  return [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: counts[stars] ?? 0,
    share: total === 0 ? 0 : (counts[stars] ?? 0) / total,
  }));
}

// Visits and contact taps -----------------------------------------------------------------------

export const TRACK_EVENTS = ["view", "whatsapp", "call", "email", "website"] as const;
export type TrackEvent = (typeof TRACK_EVENTS)[number];

export const trackSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    .max(80),
  event: z.enum(TRACK_EVENTS),
});

/** Crawlers and link previews don't count as visits. */
const BOT =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|curl|wget|python|headless/i;
export const isBot = (userAgent: string | null) => !userAgent || BOT.test(userAgent);
