export const siteName = "BrainStats";

const defaultProductionUrl = "https://brainstats.ai";

export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

  if (configured) {
    return configured;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return defaultProductionUrl;
}

export const siteDescriptionSv =
  "BrainStats är ett AI-verktyg för fotbollsanalys. Analysera matcher, form, tabell och risker — utan att ta emot spel eller pengar.";

export const defaultOgImage = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "BrainStats – AI-driven fotbollsanalys",
} as const;
