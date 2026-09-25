import type { MetadataRoute } from "next";
import { env } from "@/config/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/styleguide",
        "/account",
        "/admin",
        "/dashboard",
        // The wizard's steps; the /list-your-business page itself stays visible.
        "/list-your-business/",
      ],
    },
    sitemap: new URL("/sitemap.xml", env.NEXT_PUBLIC_SITE_URL).toString(),
  };
}
