import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/profile",
        "/login",
        "/report/",
        "/api/",
        "/premium/success",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
