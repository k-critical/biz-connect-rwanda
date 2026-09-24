import type { MetadataRoute } from "next";
import { env } from "@/config/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/styleguide"] },
    sitemap: new URL("/sitemap.xml", env.NEXT_PUBLIC_SITE_URL).toString(),
  };
}
