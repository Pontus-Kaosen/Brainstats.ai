import type { Language } from "@/lib/translations";

export type HomeContent = {
  badge: string;
  title: string;
  description: string;
  trustStrip: string;
  pasteBet: string;
  uploadBetSlip: string;
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
  howItWorksTitle: string;
  howItWorksSteps: Array<{ title: string; text: string }>;
  brainScoreTitle: string;
  brainScoreText: string;
  brainScorePoints: string[];
  brainScoreCta: string;
  trackRecordTitle: string;
  trackRecordText: string;
  trackRecordCta: string;
  sampleReportCta: string;
  uploadBetSlipLoggedIn: string;
  analyzeNow: string;
  openDashboard: string;
  transparencyBadge: string;
  mobileStatAi: string;
  mobileStatOnline: string;
  mobileStatData: string;
  mobileStatLive: string;
  mobileStatRisk: string;
  mobileStatActive: string;
  features: Array<{ title: string; text: string }>;
};

const homeContent: Record<Language, HomeContent> = {
  sv: {
    badge: "AI-driven fotbollsanalys",
    title: "Klistra in din spelidé. Få smart AI-analys.",
    description:
      "BrainStats hjälper dig att analysera matcher, statistik, form, skador och risker. Tjänsten är ett analysverktyg och tar inte emot spel eller pengar.",
    trustStrip:
      "AI-analysverktyg · Inte ett spelbolag · Vi tar inte emot spel eller pengar · 3 gratis analyser/dag",
    pasteBet: "Klistra in spelidé",
    uploadBetSlip: "Ladda upp kupong",
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
    howItWorksTitle: "Så funkar det",
    howItWorksSteps: [
      {
        title: "1. Ladda upp eller klistra in",
        text: "Skärmdump av kupong eller text — AI tolkar match och marknader.",
      },
      {
        title: "2. Brain Engine analyserar",
        text: "Form, tabell, skador, väder och marknad kombineras till en rapport.",
      },
      {
        title: "3. Få BrainScore™ & risk",
        text: "Tydlig score, risknivå och Brain Picks — spara i dashboarden.",
      },
    ],
    brainScoreTitle: "BrainScore™ — din match i siffror",
    brainScoreText:
      "Varje analys får en BrainScore från 0–100 baserad på form, statistik, skador och marknad. Plus tydlig risknivå så du ser styrkor och svagheter.",
    brainScorePoints: [
      "Form & tabell",
      "Skador & laguppställning",
      "H2H & statistik",
      "Risknivå & Brain Picks",
    ],
    brainScoreCta: "Testa BrainScore gratis",
    trackRecordTitle: "Transparent analys vs resultat",
    trackRecordText:
      "Vi visar exempel på AI-analyser före match och vad som hände efter — inga dolda vinster, inga garantier.",
    trackRecordCta: "Se analys vs resultat",
    sampleReportCta: "Se exempelrapport",
    uploadBetSlipLoggedIn: "Analysera kupong",
    analyzeNow: "Kör ny analys",
    openDashboard: "Öppna dashboard",
    transparencyBadge: "Transparens",
    mobileStatAi: "AI Engine",
    mobileStatOnline: "Online",
    mobileStatData: "Data",
    mobileStatLive: "Live",
    mobileStatRisk: "Riskmodell",
    mobileStatActive: "Aktiv",
    features: [
      {
        title: "📸 Ladda upp kupong",
        text: "AI läser skärmdump och tolkar match och marknader automatiskt.",
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
      "AI analysis tool · Not a bookmaker · We do not accept bets or money · 3 free analyses/day",
    pasteBet: "Paste bet idea",
    uploadBetSlip: "Upload bet slip",
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
    howItWorksTitle: "How it works",
    howItWorksSteps: [
      {
        title: "1. Upload or paste",
        text: "Bet slip screenshot or text — AI reads the match and markets.",
      },
      {
        title: "2. Brain Engine runs",
        text: "Form, table, injuries, weather and market combined into one report.",
      },
      {
        title: "3. Get BrainScore™ & risk",
        text: "Clear score, risk level and Brain Picks — save in your dashboard.",
      },
    ],
    brainScoreTitle: "BrainScore™ — your match in numbers",
    brainScoreText:
      "Every analysis gets a BrainScore from 0–100 based on form, stats, injuries and market. Plus a clear risk level so you see strengths and weaknesses.",
    brainScorePoints: [
      "Form & table",
      "Injuries & lineups",
      "H2H & statistics",
      "Risk level & Brain Picks",
    ],
    brainScoreCta: "Try BrainScore free",
    trackRecordTitle: "Transparent analysis vs outcome",
    trackRecordText:
      "See examples of AI analyses before kick-off and what happened after — no hidden wins, no guarantees.",
    trackRecordCta: "View analysis vs outcome",
    sampleReportCta: "See sample report",
    uploadBetSlipLoggedIn: "Analyze bet slip",
    analyzeNow: "Run new analysis",
    openDashboard: "Open dashboard",
    transparencyBadge: "Transparency",
    mobileStatAi: "AI Engine",
    mobileStatOnline: "Online",
    mobileStatData: "Data",
    mobileStatLive: "Live",
    mobileStatRisk: "Risk model",
    mobileStatActive: "Active",
    features: [
      {
        title: "📸 Upload bet slip",
        text: "AI reads your screenshot and parses match and markets automatically.",
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
