import type { Language } from "@/lib/translations";

export type LandingSlug =
  | "football-analysis"
  | "upload-bet-slip"
  | "value-bets"
  | "ai-tips"
  | "ai-analys";

export type LandingPageContent = {
  slug: LandingSlug;
  seoTitle: string;
  seoDescription: string;
  badge: string;
  title: string;
  description: string;
  bullets: string[];
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  accent?: "green" | "blue" | "gold";
};

const pages: Record<LandingSlug, Record<Language, LandingPageContent>> = {
  "football-analysis": {
    sv: {
      slug: "football-analysis",
      seoTitle: "AI fotbollsanalys",
      seoDescription:
        "Få AI-driven fotbollsanalys med BrainScore, form, skador och risknivå. BrainStats analyserar dina spelidéer — inte ett spelbolag.",
      badge: "AI fotbollsanalys",
      title: "AI fotbollsanalys för dina egna spelidéer",
      description:
        "BrainStats kombinerar form, tabell, skador, väder och marknad i en tydlig AI-rapport med BrainScore™ och risknivå.",
      bullets: [
        "3 gratis AI-analyser per dag",
        "BrainScore™, risk och Brain Picks",
        "Form, H2H, skador och statistik",
        "Inte ett spelbolag — analysverktyg",
      ],
      primaryCta: { label: "Starta gratis", href: "/login?next=/analyze" },
      secondaryCta: { label: "Ladda upp kupong", href: "/analyze?mode=image" },
    },
    en: {
      slug: "football-analysis",
      seoTitle: "AI football analysis",
      seoDescription:
        "AI-powered football analysis with BrainScore, form, injuries and risk level. BrainStats analyzes your bet ideas — not a bookmaker.",
      badge: "AI football analysis",
      title: "AI football analysis for your own bet ideas",
      description:
        "BrainStats combines form, table, injuries, weather and market data into a clear AI report with BrainScore™ and risk level.",
      bullets: [
        "3 free AI analyses per day",
        "BrainScore™, risk and Brain Picks",
        "Form, H2H, injuries and stats",
        "Not a bookmaker — analysis tool",
      ],
      primaryCta: { label: "Start free", href: "/login?next=/analyze" },
      secondaryCta: { label: "Upload bet slip", href: "/analyze?mode=image" },
    },
  },
  "upload-bet-slip": {
    sv: {
      slug: "upload-bet-slip",
      seoTitle: "Ladda upp spelkupong",
      seoDescription:
        "Ladda upp skärmdump av din spelkupong — BrainStats AI läser match och marknader och kör Brain Engine-analys.",
      badge: "Bilduppladdning",
      title: "Ladda upp din spelkupong — AI läser den åt dig",
      description:
        "Ta en skärmdump från ditt spelkonto, ladda upp i BrainStats och få en full AI-rapport på några sekunder.",
      bullets: [
        "Fungerar med de flesta kupongformat",
        "AI tolkar match och marknader automatiskt",
        "BrainScore™ och risk efter analys",
        "Gratis att testa — 3 analyser/dag",
      ],
      primaryCta: {
        label: "Ladda upp kupong",
        href: "/login?next=/analyze?mode=image",
      },
      secondaryCta: { label: "Klistra in text", href: "/analyze" },
    },
    en: {
      slug: "upload-bet-slip",
      seoTitle: "Upload bet slip",
      seoDescription:
        "Upload a screenshot of your bet slip — BrainStats AI reads the match and markets and runs Brain Engine analysis.",
      badge: "Image upload",
      title: "Upload your bet slip — AI reads it for you",
      description:
        "Take a screenshot from your betting app, upload to BrainStats and get a full AI report in seconds.",
      bullets: [
        "Works with most bet slip formats",
        "AI parses match and markets automatically",
        "BrainScore™ and risk after analysis",
        "Free to try — 3 analyses/day",
      ],
      primaryCta: {
        label: "Upload bet slip",
        href: "/login?next=/analyze?mode=image",
      },
      secondaryCta: { label: "Paste text", href: "/analyze" },
    },
  },
  "value-bets": {
    sv: {
      slug: "value-bets",
      seoTitle: "Value bets fotboll",
      seoDescription:
        "Dagliga AI value bets för fotboll. BrainStats Elite hittar marknader med positivt förväntat värde — transparent logg och track record.",
      badge: "Value bets",
      title: "AI value bets för fotboll — dagliga urval",
      description:
        "BrainStats analyserar odds, form och statistik för att hitta value bets där marknaden kan vara felprissatt. Samma urval hela dagen, verifierbar historik på startsidan.",
      bullets: [
        "Dagliga value bets — låsta till kickoff",
        "1X2, över/under och BTTS",
        "Odds validerade mot svenska spelbolag",
        "Publik logg med träffsäkerhet",
      ],
      primaryCta: { label: "Skapa konto", href: "/login?next=/value-bets" },
      secondaryCta: { label: "Se Premium", href: "/premium" },
      accent: "blue",
    },
    en: {
      slug: "value-bets",
      seoTitle: "Football value bets",
      seoDescription:
        "Daily AI football value bets. BrainStats Elite finds markets with positive expected value — transparent log and track record.",
      badge: "Value bets",
      title: "AI football value bets — daily picks",
      description:
        "BrainStats analyzes odds, form and stats to find value bets where the market may be mispriced. Same picks all day, verifiable history on the homepage.",
      bullets: [
        "Daily value bets — locked until kickoff",
        "1X2, over/under and BTTS",
        "Odds validated against bookmakers",
        "Public log with hit rate",
      ],
      primaryCta: { label: "Create account", href: "/login?next=/value-bets" },
      secondaryCta: { label: "See Premium", href: "/premium" },
      accent: "blue",
    },
  },
  "ai-tips": {
    sv: {
      slug: "ai-tips",
      seoTitle: "AI speltips fotboll",
      seoDescription:
        "Dagliga AI-speltips och färdiga fotbollskuponger. BrainStats Pro och Elite skapar kuponger med BrainScore, form och riskprofil.",
      badge: "AI speltips",
      title: "Dagliga AI-speltips för fotboll",
      description:
        "Färdiga AI-kuponger varje dag — från säkra singlar till högre odds. BrainStats kombinerar statistik, form och marknad i tydliga speltips.",
      bullets: [
        "Nya AI-kuponger varje dag",
        "Olika risknivåer och marknader",
        "BrainScore och tydlig motivering",
        "Pro och Elite — testa 7 dagar gratis",
      ],
      primaryCta: { label: "Skapa konto", href: "/login?next=/ai-tips" },
      secondaryCta: { label: "Analysera egen idé", href: "/analyze" },
      accent: "green",
    },
    en: {
      slug: "ai-tips",
      seoTitle: "AI football tips",
      seoDescription:
        "Daily AI football tips and ready-made bet slips. BrainStats Pro and Elite build coupons with BrainScore, form and risk profile.",
      badge: "AI tips",
      title: "Daily AI football betting tips",
      description:
        "Ready-made AI bet slips every day — from safer singles to higher odds. BrainStats combines stats, form and market into clear tips.",
      bullets: [
        "New AI slips every day",
        "Different risk levels and markets",
        "BrainScore and clear reasoning",
        "Pro and Elite — 7-day free trial",
      ],
      primaryCta: { label: "Create account", href: "/login?next=/ai-tips" },
      secondaryCta: { label: "Analyze your own bet", href: "/analyze" },
      accent: "green",
    },
  },
  "ai-analys": {
    sv: {
      slug: "ai-analys",
      seoTitle: "AI analys fotboll",
      seoDescription:
        "AI analys av fotboll och spelidéer. BrainStats ger BrainScore, risk, form och statistik — analysera fotbollsbets gratis.",
      badge: "AI analys",
      title: "AI analys för fotbollsbets och matcher",
      description:
        "Klistra in din spelidé, ladda upp kupong eller bygg i Brain Builder. BrainStats AI analyserar match, marknad och risk på sekunder.",
      bullets: [
        "AI analysera fotbollsbets gratis",
        "BrainScore™, risk och Brain Picks",
        "Form, tabell, skador och väder",
        "Inte ett spelbolag",
      ],
      primaryCta: { label: "Starta AI-analys", href: "/login?next=/analyze" },
      secondaryCta: { label: "Se value bets", href: "/value-bets" },
      accent: "gold",
    },
    en: {
      slug: "ai-analys",
      seoTitle: "AI football analysis",
      seoDescription:
        "AI analysis of football and bet ideas. BrainStats delivers BrainScore, risk, form and stats — analyze football bets for free.",
      badge: "AI analysis",
      title: "AI analysis for football bets and matches",
      description:
        "Paste your bet idea, upload a slip or build in Brain Builder. BrainStats AI analyzes match, market and risk in seconds.",
      bullets: [
        "Analyze football bets with AI for free",
        "BrainScore™, risk and Brain Picks",
        "Form, table, injuries and weather",
        "Not a bookmaker",
      ],
      primaryCta: { label: "Start AI analysis", href: "/login?next=/analyze" },
      secondaryCta: { label: "See value bets", href: "/value-bets" },
      accent: "gold",
    },
  },
};

export function getLandingPage(slug: LandingSlug, language: Language) {
  return pages[slug][language];
}

export const landingSlugs = Object.keys(pages) as LandingSlug[];

export const landingPaths: Record<LandingSlug, string> = {
  "football-analysis": "/football-analysis",
  "upload-bet-slip": "/upload-bet-slip",
  "value-bets": "/value-bets",
  "ai-tips": "/ai-tips",
  "ai-analys": "/ai-analys",
};
