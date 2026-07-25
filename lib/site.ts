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
  "BrainStats är ett AI-verktyg för fotbollsanalys och value bets. Analysera fotbollsbets, få AI-speltips och dagliga value bets — utan att ta emot spel eller pengar.";

export const siteDescriptionEn =
  "BrainStats is an AI football analysis and value bets tool. Analyze football bets, get AI tips and daily value picks — we do not accept bets or money.";

export const siteKeywordsSv = [
  "value bets",
  "value bets fotboll",
  "ai analys",
  "ai analys fotboll",
  "ai analysera fotboll",
  "ai analysera fotbollsbets",
  "fotbollsbets analys",
  "ai speltips fotboll",
  "fotbollsanalys",
  "AI fotboll",
  "spelanalys",
  "matchanalys",
  "BrainStats",
] as const;

export const siteKeywordsEn = [
  "value bets",
  "football value bets",
  "AI football analysis",
  "analyze football bets",
  "AI betting tips football",
  "football bet analysis",
  "soccer AI analysis",
  "BrainStats",
] as const;

export const defaultOgImage = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "BrainStats – AI-driven fotbollsanalys",
} as const;
