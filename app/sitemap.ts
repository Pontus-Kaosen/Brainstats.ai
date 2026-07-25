import type { MetadataRoute } from "next";

import { legalSlugs } from "@/lib/legalSlugs";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const now = new Date();

  const highPriorityRoutes = [
    "",
    "/analyze",
    "/value-bets",
    "/ai-tips",
    "/ai-analys",
    "/football-analysis",
    "/upload-bet-slip",
  ];

  const mediumPriorityRoutes = [
    "/builder",
    "/premium",
    "/track-record",
    "/standings",
    "/legal",
  ];

  const staticRoutes: MetadataRoute.Sitemap = [
    ...highPriorityRoutes.map((path) => ({
      url: `${siteUrl}${path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.9,
    })),
    ...mediumPriorityRoutes.map((path) => ({
      url: `${siteUrl}${path}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];

  const legalRoutes: MetadataRoute.Sitemap = legalSlugs.map((slug) => ({
    url: `${siteUrl}/legal/${slug}`,
    lastModified: now,
    changeFrequency: "yearly" as const,
    priority: 0.4,
  }));

  return [...staticRoutes, ...legalRoutes];
}
