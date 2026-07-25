import type { Metadata } from "next";

import type { Language } from "@/lib/translations";
import {
  defaultOgImage,
  getSiteUrl,
  siteDescriptionEn,
  siteDescriptionSv,
  siteKeywordsEn,
  siteKeywordsSv,
  siteName,
} from "@/lib/site";

type PageMetadataOptions = {
  title: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
  keywords?: readonly string[];
  language?: Language;
};

export function createPageMetadata({
  title,
  description,
  path = "",
  noIndex = false,
  keywords,
  language = "sv",
}: PageMetadataOptions): Metadata {
  const url = `${getSiteUrl()}${path}`;
  const fullTitle = title === siteName ? siteName : `${title} | ${siteName}`;
  const resolvedDescription =
    description ?? (language === "en" ? siteDescriptionEn : siteDescriptionSv);
  const resolvedKeywords =
    keywords ??
    (language === "en" ? [...siteKeywordsEn] : [...siteKeywordsSv]);

  return {
    title,
    description: resolvedDescription,
    keywords: [...resolvedKeywords],
    alternates: {
      canonical: url,
      languages: {
        sv: url,
        en: url,
        "x-default": url,
      },
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      title: fullTitle,
      description: resolvedDescription,
      url,
      siteName,
      locale: language === "en" ? "en_US" : "sv_SE",
      alternateLocale: language === "en" ? ["sv_SE"] : ["en_US"],
      type: "website",
      images: [defaultOgImage],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: resolvedDescription,
      images: [defaultOgImage.url],
    },
  };
}

export const pageSeo = {
  home: {
    sv: {
      title: "AI fotbollsanalys & value bets",
      description:
        "Analysera fotbollsbets med AI. BrainStats ger value bets, AI-speltips, BrainScore och riskanalys — gratis att testa, inget spelbolag.",
      path: "/",
    },
    en: {
      title: "AI football analysis & value bets",
      description:
        "Analyze football bets with AI. BrainStats delivers value bets, AI tips, BrainScore and risk analysis — free to try, not a bookmaker.",
      path: "/",
    },
  },
  builder: {
    title: "Bygg spelidé",
    description:
      "Bygg din spelidé steg för steg. Välj land, liga, match och marknad — lägg till i BrainSlip och få AI-driven fotbollsanalys.",
    path: "/builder",
    keywords: [
      "bygg spelidé",
      "fotbollsbets",
      "ai analys",
      "spelanalys fotboll",
    ],
  },
  analyze: {
    sv: {
      title: "AI analysera fotbollsbets",
      description:
        "Klistra in din spelidé eller ladda upp kupong — få AI-analys med BrainScore, form, tabell, skador och risk för fotbollsmatcher.",
      path: "/analyze",
      keywords: [
        "ai analysera fotboll",
        "ai analysera fotbollsbets",
        "fotbollsbets analys",
        "ai analys fotboll",
        "spelanalys",
      ],
    },
    en: {
      title: "AI analyze football bets",
      description:
        "Paste your bet idea or upload a slip — get AI analysis with BrainScore, form, table, injuries and risk for football matches.",
      path: "/analyze",
      keywords: [
        "analyze football bets",
        "AI football bet analysis",
        "football betting analysis",
      ],
    },
  },
  aiTips: {
    sv: {
      title: "AI speltips fotboll — dagliga kuponger",
      description:
        "Dagliga AI-speltips och färdiga fotbollskuponger med olika riskprofil. BrainStats Elite skapar AI-kuponger baserat på form, odds och statistik.",
      path: "/ai-tips",
      keywords: [
        "ai speltips fotboll",
        "ai fotbollstips",
        "dagliga speltips",
        "ai kupong fotboll",
      ],
    },
    en: {
      title: "AI football tips — daily slips",
      description:
        "Daily AI football tips and ready-made bet slips with different risk profiles. BrainStats Elite builds AI coupons from form, odds and stats.",
      path: "/ai-tips",
      keywords: [
        "AI football tips",
        "daily football betting tips",
        "AI bet slip football",
      ],
    },
  },
  valueBets: {
    sv: {
      title: "Value bets fotboll — AI value betting",
      description:
        "Dagliga value bets för fotboll med AI. BrainStats hittar marknader där oddsen kan vara högre än sannolikheten — transparent logg och track record.",
      path: "/value-bets",
      keywords: [
        "value bets",
        "value bets fotboll",
        "value betting fotboll",
        "ai value bets",
        "fotboll value bets",
      ],
    },
    en: {
      title: "Football value bets — AI value betting",
      description:
        "Daily AI football value bets. BrainStats finds markets where odds may exceed probability — transparent log and track record.",
      path: "/value-bets",
      keywords: [
        "value bets football",
        "football value betting",
        "AI value bets",
      ],
    },
  },
  premium: {
    sv: {
      title: "Premium — Pro & Elite",
      description:
        "BrainStats Pro och Elite — fler AI-analyser, dagliga AI-kuponger, value bets och djupare rapporter. 7 dagar Pro gratis.",
      path: "/premium",
      keywords: ["BrainStats premium", "value bets", "ai speltips", "pro elite"],
    },
    en: {
      title: "Premium — Pro & Elite",
      description:
        "BrainStats Pro and Elite — more AI analyses, daily AI slips, value bets and deeper reports. 7-day Pro free trial.",
      path: "/premium",
      keywords: ["BrainStats premium", "value bets", "AI football tips", "pro elite"],
    },
  },
  trackRecord: {
    title: "Analys vs resultat",
    description:
      "Transparent exempel på BrainStats AI-analyser och value bets före match — utfall efter. Inga garantier, bara verifierbar historik.",
    path: "/track-record",
    keywords: ["track record", "value bets resultat", "ai analys resultat"],
  },
  footballAnalysis: {
    title: "AI fotbollsanalys",
    description:
      "AI-driven fotbollsanalys med BrainScore, form, skador och risk. Analysera dina egna spelidéer gratis — 3 analyser per dag.",
    path: "/football-analysis",
    keywords: [
      "ai fotbollsanalys",
      "fotbollsanalys ai",
      "ai analys fotboll",
    ],
  },
  aiAnalys: {
    title: "AI analys fotboll",
    description:
      "Få AI-analys av fotbollsmatcher och spelidéer. BrainStats kombinerar statistik, form och odds till tydliga rekommendationer med BrainScore.",
    path: "/ai-analys",
    keywords: [
      "ai analys",
      "ai analys fotboll",
      "ai analysera fotboll",
      "fotboll ai analys",
    ],
  },
  uploadBetSlip: {
    title: "Ladda upp spelkupong",
    description:
      "Ladda upp skärmdump av din spelkupong — BrainStats AI läser match och marknader automatiskt och analyserar ditt fotbollsbet.",
    path: "/upload-bet-slip",
    keywords: [
      "ladda upp spelkupong",
      "ai analysera kupong",
      "fotbollsbets analys",
    ],
  },
  legal: {
    title: "Juridisk information",
    description:
      "Användarvillkor, integritetspolicy, cookiepolicy, köpvillkor och ansvarsfriskrivning för BrainStats.",
    path: "/legal",
  },
} as const;

type LocalizedSeoEntry = {
  title: string;
  description: string;
  path: string;
  keywords?: readonly string[];
};

export function getLocalizedPageSeo(
  key: "home" | "analyze" | "aiTips" | "valueBets" | "premium",
  language: Language
): LocalizedSeoEntry {
  const entry = pageSeo[key] as
    | LocalizedSeoEntry
    | { sv: LocalizedSeoEntry; en: LocalizedSeoEntry };

  if ("sv" in entry && "en" in entry) {
    return entry[language];
  }

  return entry;
}
