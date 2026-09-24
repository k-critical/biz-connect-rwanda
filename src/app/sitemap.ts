import type { MetadataRoute } from "next";
import { categories } from "@/config/categories";
import { env } from "@/config/env";
import { getSitemapBusinesses } from "@/server/services/directory-service";

// Built on request so newly approved businesses appear without a redeploy.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = (path: string) => new URL(path, env.NEXT_PUBLIC_SITE_URL).toString();
  const businesses = await getSitemapBusinesses();
  return [
    { url: url("/"), changeFrequency: "daily", priority: 1 },
    { url: url("/explore"), changeFrequency: "daily", priority: 0.8 },
    ...categories.map((c) => ({
      url: url(`/c/${c.slug}`),
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...businesses.map((b) => ({
      url: url(`/b/${b.slug}`),
      lastModified: b.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
