import type { Language } from "@/lib/translations";

export type HomeContent = {
  badge: string;
  title: string;
  description: string;
  pasteBet: string;
  buildBet: string;
  seePremium: string;
  features: Array<{ title: string; text: string }>;
};

const homeContent: Record<Language, HomeContent> = {
  sv: {
    badge: "AI-driven fotbollsanalys",
    title: "Klistra in din spelidé. Få smart AI-analys.",
    description:
      "BrainStats hjälper dig att analysera matcher, statistik, form, skador och risker. Tjänsten är ett analysverktyg och tar inte emot spel eller pengar.",
    pasteBet: "Klistra in spelidé",
    buildBet: "Bygg spelidé",
    seePremium: "Se Premium",
    features: [
      {
        title: "📋 Klistra in",
        text: "Kopiera din spelidé och låt BrainStats tolka den.",
      },
      {
        title: "🧠 Brain Engine",
        text: "Få BrainScore™, risknivå och identifierade marknader.",
      },
      {
        title: "💎 Premium",
        text: "Lås upp djupare rapporter och fler analyser.",
      },
    ],
  },
  en: {
    badge: "AI-powered football analysis",
    title: "Paste your bet idea. Get smart AI analysis.",
    description:
      "BrainStats helps you analyze matches, stats, form, injuries and risk. This is an analysis tool — we do not accept bets or money.",
    pasteBet: "Paste bet idea",
    buildBet: "Build bet idea",
    seePremium: "See Premium",
    features: [
      {
        title: "📋 Paste in",
        text: "Copy your bet idea and let BrainStats interpret it.",
      },
      {
        title: "🧠 Brain Engine",
        text: "Get BrainScore™, risk level and identified markets.",
      },
      {
        title: "💎 Premium",
        text: "Unlock deeper reports and more analyses.",
      },
    ],
  },
};

export function getHomeContent(language: Language) {
  return homeContent[language];
}
