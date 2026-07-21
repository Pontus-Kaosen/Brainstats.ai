import type { Language } from "@/lib/translations";
import type { WorthBetting } from "@/lib/worthBetting";

export type SampleAnalysis = {
  betText: string;
  summary: string;
  strengths: string[];
  risks: string[];
  recommendation: string;
  brainScore: number;
  riskLevel: string;
  confidence: number;
  worthBetting: WorthBetting;
  brainPicks: Array<{
    id: number;
    market: string;
    probability: number;
    estimatedOdds: number;
    riskLevel: "Low" | "Medium" | "High";
    reason: string;
  }>;
};

const samples: Record<Language, SampleAnalysis> = {
  sv: {
    betText: "Liverpool - Arsenal\nÖver 2.5 mål",
    summary:
      "Båda lagen har hög offensiv form och möter varandra i en match där mål historiskt sett är vanligt. Liverpool har stark hemmastatistik medan Arsenal skapar chanser även borta.",
    strengths: [
      "Liverpool har gjort mål i 8 av 10 senaste hemmamatcher.",
      "Arsenal har över 2.5 mål i 6 av 10 senaste bortamatcher.",
      "Inbördes möten visar ofta öppet spel med flera målchanser.",
    ],
    risks: [
      "Arsenal kan spela mer kontrollerat om de tar ledningen tidigt.",
      "Viktiga offensiva spelare kan vila inför kommande Europaspel.",
      "Domare och väder kan påverka tempot negativt.",
    ],
    recommendation:
      "Datat pekar mot en match med flera målchanser, men hög varians kvarstår. Över 2.5 mål har stöd i form och H2H, men inget spel är säkert.\n\n18+. Detta är en AI-analys baserad på tillgänglig data — inte spelråd eller garanti.",
    brainScore: 74,
    riskLevel: "Medium",
    confidence: 71,
    worthBetting: {
      verdict: "risky",
      headline: "Blandat stöd för över 2.5 mål",
      reason:
        "Form och inbördes möten stödjer din idé, men rotationsrisk och Arsenal som kan stänga matchen gör att oddset bör vara attraktivt för att kompensera osäkerheten.",
    },
    brainPicks: [
      {
        id: 1,
        market: "Över 2.5 mål",
        probability: 62,
        estimatedOdds: 1.61,
        riskLevel: "Medium",
        reason:
          "Hög offensiv form hos båda lagen och historiskt målrikt H2H. Risk för lägre tempo om något lag leder tidigt.",
      },
    ],
  },
  en: {
    betText: "Liverpool - Arsenal\nOver 2.5 goals",
    summary:
      "Both teams are in strong offensive form and meet in a fixture where goals have been common historically. Liverpool have solid home numbers while Arsenal create chances away.",
    strengths: [
      "Liverpool have scored in 8 of their last 10 home matches.",
      "Arsenal have gone over 2.5 goals in 6 of their last 10 away matches.",
      "Head-to-head meetings often produce open football with multiple chances.",
    ],
    risks: [
      "Arsenal may play more conservatively if they take an early lead.",
      "Key attackers may be rested ahead of upcoming European fixtures.",
      "Referee and weather could reduce the tempo.",
    ],
    recommendation:
      "Data leans toward a match with several scoring chances, but variance remains high. Over 2.5 goals is supported by form and H2H, but no bet is safe.\n\n18+. This is an AI analysis based on available data — not betting advice or a guarantee.",
    brainScore: 74,
    riskLevel: "Medium",
    confidence: 71,
    worthBetting: {
      verdict: "risky",
      headline: "Mixed support for over 2.5 goals",
      reason:
        "Form and head-to-head support your idea, but rotation risk and Arsenal potentially shutting the game down mean the price should compensate for the uncertainty.",
    },
    brainPicks: [
      {
        id: 1,
        market: "Over 2.5 goals",
        probability: 62,
        estimatedOdds: 1.61,
        riskLevel: "Medium",
        reason:
          "Strong offensive form for both sides and a historically goal-heavy H2H. Risk of a slower tempo if one team leads early.",
      },
    ],
  },
};

export function getSampleAnalysis(language: Language): SampleAnalysis {
  return samples[language];
}
