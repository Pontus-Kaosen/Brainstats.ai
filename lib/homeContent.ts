import type { Language } from "@/lib/translations";

export type HomeContent = {
  badge: string;
  title: string;
  description: string;
  trustStrip: string;
  pasteBet: string;
  buildBet: string;
  seePremium: string;
  signupFree: string;
  trialBadge: string;
  trialTitle: string;
  trialText: string;
  trialCta: string;
  aiTipsBadge: string;
  aiTipsTitle: string;
  aiTipsText: string;
  aiTipsCta: string;
  features: Array<{ title: string; text: string }>;
};

const homeContent: Record<Language, HomeContent> = {
  sv: {
    badge: "AI-driven fotbollsanalys",
    title: "Klistra in din spelidé. Få smart AI-analys.",
    description:
      "BrainStats hjälper dig att analysera matcher, statistik, form, skador och risker. Tjänsten är ett analysverktyg och tar inte emot spel eller pengar.",
    trustStrip:
      "AI-analysverktyg · Inte ett spelbolag · Vi tar inte emot spel eller pengar",
    pasteBet: "Klistra in spelidé",
    buildBet: "Bygg spelidé",
    seePremium: "7 dagar Pro gratis",
    signupFree: "Skapa gratis konto",
    trialBadge: "Lanseringserbjudande",
    trialTitle: "Testa Pro gratis i 7 dagar",
    trialText:
      "Obegränsade AI-analyser, Brain Builder och dagliga AI-kuponger. Avsluta när som helst.",
    trialCta: "Starta gratis provperiod",
    aiTipsBadge: "Dagliga AI-kuponger",
    aiTipsTitle: "Färdiga AI-speltips varje dag",
    aiTipsText:
      "BrainStats skapar dagliga AI-kuponger med olika riskprofil, matcher och estimerade fair odds — direkt i din dashboard.",
    aiTipsCta: "Se dagens AI-tips",
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
        title: "🎯 AI-tips",
        text: "Färdiga dagliga AI-kuponger med riskprofil och estimerade fair odds.",
      },
    ],
  },
  en: {
    badge: "AI-powered football analysis",
    title: "Paste your bet idea. Get smart AI analysis.",
    description:
      "BrainStats helps you analyze matches, stats, form, injuries and risk. This is an analysis tool — we do not accept bets or money.",
    trustStrip:
      "AI analysis tool · Not a bookmaker · We do not accept bets or money",
    pasteBet: "Paste bet idea",
    buildBet: "Build bet idea",
    seePremium: "7 days Pro free",
    signupFree: "Create free account",
    trialBadge: "Launch offer",
    trialTitle: "Try Pro free for 7 days",
    trialText:
      "Unlimited AI analyses, Brain Builder and daily AI slips. Cancel anytime.",
    trialCta: "Start free trial",
    aiTipsBadge: "Daily AI slips",
    aiTipsTitle: "Ready-made AI bet tips every day",
    aiTipsText:
      "BrainStats creates daily AI slips with different risk profiles, matches and estimated fair odds — right in your dashboard.",
    aiTipsCta: "See today's AI tips",
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
        title: "🎯 AI tips",
        text: "Ready-made daily AI slips with risk profile and estimated fair odds.",
      },
    ],
  },
};

export function getHomeContent(language: Language) {
  return homeContent[language];
}
