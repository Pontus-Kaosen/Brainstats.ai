import type { Language } from "@/lib/translations";

export type TrackRecordEntry = {
  date: string;
  match: string;
  market: string;
  brainScore: number;
  risk: string;
  outcome: "won" | "lost" | "void" | "pending";
  note: string;
};

export type TrackRecordContent = {
  badge: string;
  title: string;
  description: string;
  disclaimer: string;
  howTitle: string;
  howSteps: string[];
  tableHeaders: {
    date: string;
    match: string;
    pick: string;
    score: string;
    risk: string;
    result: string;
  };
  outcomeLabels: Record<TrackRecordEntry["outcome"], string>;
  emptyNote: string;
  ctaTitle: string;
  ctaText: string;
  ctaAnalyze: string;
  ctaPremium: string;
  entries: TrackRecordEntry[];
};

const entries: TrackRecordEntry[] = [
  {
    date: "2026-07-12",
    match: "Arsenal vs Chelsea",
    market: "Over 2.5 goals",
    brainScore: 74,
    risk: "Medium",
    outcome: "won",
    note: "AI Match of the Day — high tempo & open defensive records.",
  },
  {
    date: "2026-07-11",
    match: "Malmö FF vs AIK",
    market: "Home win",
    brainScore: 68,
    risk: "Medium",
    outcome: "lost",
    note: "Daily Brain Pick — home form strong but red card changed game.",
  },
  {
    date: "2026-07-10",
    match: "Barcelona vs Sevilla",
    market: "Both teams to score",
    brainScore: 71,
    risk: "Lower",
    outcome: "won",
    note: "Value Bet highlight — attacking xG trend on both sides.",
  },
  {
    date: "2026-07-14",
    match: "Liverpool vs Brighton",
    market: "Liverpool -1 AH",
    brainScore: 66,
    risk: "Higher",
    outcome: "pending",
    note: "Published pre-match — result updated after full time.",
  },
];

const content: Record<Language, TrackRecordContent> = {
  sv: {
    badge: "📊 Transparens",
    title: "Analys vs resultat",
    description:
      "Vi visar exempel på hur BrainStats AI-analyser såg ut före match — och vad som hände efteråt. Ingen garanti för framtida resultat.",
    disclaimer:
      "BrainStats är ett analysverktyg, inte ett spelbolag. Tidigare analyser är ingen garanti. Uppdatera exemplen här regelbundet för att bygga förtroende.",
    howTitle: "Så funkar det",
    howSteps: [
      "AI publicerar analys med BrainScore™, risk och marknad före match.",
      "Matchen spelas — vi uppdaterar resultatet efter slutwhistle.",
      "Du ser analys vs utfall side-by-side. Transparent, inte hype.",
    ],
    tableHeaders: {
      date: "Datum",
      match: "Match",
      pick: "Marknad",
      score: "BrainScore",
      risk: "Risk",
      result: "Resultat",
    },
    outcomeLabels: {
      won: "Träff",
      lost: "Miss",
      void: "Void",
      pending: "Väntar",
    },
    emptyNote: "Fler resultat läggs till löpande.",
    ctaTitle: "Testa själv",
    ctaText: "Kör din egen analys gratis — 3 per dag.",
    ctaAnalyze: "Analysera spelidé",
    ctaPremium: "Se Premium",
    entries,
  },
  en: {
    badge: "📊 Transparency",
    title: "Analysis vs outcome",
    description:
      "Examples of how BrainStats AI analyses looked before kick-off — and what happened after. No guarantee of future results.",
    disclaimer:
      "BrainStats is an analysis tool, not a bookmaker. Past analyses are not a guarantee. Update these examples regularly to build trust.",
    howTitle: "How it works",
    howSteps: [
      "AI publishes analysis with BrainScore™, risk and market before the match.",
      "The match is played — we update the outcome after full time.",
      "You see analysis vs result side-by-side. Transparent, not hype.",
    ],
    tableHeaders: {
      date: "Date",
      match: "Match",
      pick: "Market",
      score: "BrainScore",
      risk: "Risk",
      result: "Outcome",
    },
    outcomeLabels: {
      won: "Hit",
      lost: "Miss",
      void: "Void",
      pending: "Pending",
    },
    emptyNote: "More results added regularly.",
    ctaTitle: "Try it yourself",
    ctaText: "Run your own analysis free — 3 per day.",
    ctaAnalyze: "Analyze bet idea",
    ctaPremium: "See Premium",
    entries,
  },
};

export function getTrackRecordContent(language: Language) {
  return content[language];
}
