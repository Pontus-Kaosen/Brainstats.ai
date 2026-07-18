import type { MetadataRoute } from "next";

import { legalSlugs } from "@/lib/legalSlugs";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/builder",
    "/analyze",
    "/premium",
    "/track-record",
    "/standings",
    "/football-analysis",
    "/upload-bet-slip",
    "/legal",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority:
      path === ""
        ? 1
        : path === "/builder" ||
            path === "/analyze" ||
            path === "/football-analysis" ||
            path === "/upload-bet-slip"
          ? 0.9
          : 0.7,
  }));

  const legalRoutes: MetadataRoute.Sitemap = legalSlugs.map((slug) => ({
    url: `${siteUrl}/legal/${slug}`,
    lastModified: now,
    changeFrequency: "yearly",
    priority: 0.4,
  }));

  return [...staticRoutes, ...legalRoutes];
}
