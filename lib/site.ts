export const siteName = "BrainStats";

const defaultProductionUrl = "https://www.brainstats.eu";

export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

  const resolved =
    configured ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : defaultProductionUrl);

  // Apex redirects to www on Vercel — keep sitemap/canonical URLs consistent.
  if (resolved === "https://brainstats.eu") {
    return "https://www.brainstats.eu";
  }

  return resolved;
}

export const siteDescriptionSv =
  "BrainStats är ett AI-verktyg för fotbollsanalys. Analysera matcher, form, tabell och risker — utan att ta emot spel eller pengar.";

export const defaultOgImage = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "BrainStats – AI-driven fotbollsanalys",
} as const;
