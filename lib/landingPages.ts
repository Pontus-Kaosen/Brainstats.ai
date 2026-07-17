import type { Language } from "@/lib/translations";

export type LandingSlug = "football-analysis" | "upload-bet-slip";

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
};

export function getLandingPage(slug: LandingSlug, language: Language) {
  return pages[slug][language];
}

export const landingSlugs = Object.keys(pages) as LandingSlug[];
