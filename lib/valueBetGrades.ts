import type { Language } from "@/lib/translations";
import { normalizeToBettableMarket } from "@/lib/bettableMarkets";

export type ValueBetTier = 1 | 2 | 3 | 4 | 5;

export type ValueBetGrade = {
  tier: ValueBetTier;
  labelSv: string;
  labelEn: string;
  descriptionSv: string;
  descriptionEn: string;
};

export const VALUE_BET_GRADES: ValueBetGrade[] = [
  {
    tier: 5,
    labelSv: "Elite-värde",
    labelEn: "Elite Value",
    descriptionSv: "Hög value och hög AI-sannolikhet — bäst balans.",
    descriptionEn: "High value and high AI probability — best balance.",
  },
  {
    tier: 4,
    labelSv: "Starkt värde",
    labelEn: "Strong Value",
    descriptionSv: "Tydlig edge med stabil sannolikhetsprofil.",
    descriptionEn: "Clear edge with a stable probability profile.",
  },
  {
    tier: 3,
    labelSv: "Medel värde",
    labelEn: "Moderate Value",
    descriptionSv: "God kombination av value och rimlig säkerhet.",
    descriptionEn: "Good mix of value and reasonable safety.",
  },
  {
    tier: 2,
    labelSv: "Lågt värde",
    labelEn: "Low Value",
    descriptionSv: "Mindre edge — lägre prioritet.",
    descriptionEn: "Smaller edge — lower priority.",
  },
  {
    tier: 1,
    labelSv: "Inget värde",
    labelEn: "No Value",
    descriptionSv: "Under tröskeln för dagens urval.",
    descriptionEn: "Below today's selection threshold.",
  },
];

function clampTier(value: number): ValueBetTier {
  if (value <= 1) return 1;
  if (value >= 5) return 5;
  return value as ValueBetTier;
}

export function getValueBetGrade(
  tier: number,
  language: Language
): ValueBetGrade & { label: string; description: string } {
  const grade = VALUE_BET_GRADES[clampTier(tier) - 1];

  return {
    ...grade,
    label: language === "en" ? grade.labelEn : grade.labelSv,
    description: language === "en" ? grade.descriptionEn : grade.descriptionSv,
  };
}

export function calculateValueBetScore(
  edgePercent: number,
  fairProbability: number
) {
  return Number((edgePercent * 0.35 + fairProbability * 0.65).toFixed(2));
}

export function isHighConfidenceValueMarket(market: string) {
  const normalized = market.trim().toLowerCase();

  if (
    normalized.includes("draw") ||
    normalized.includes("oavgjort") ||
    normalized.includes("away win") ||
    normalized.includes("bortalag vinner") ||
    normalized.includes("both teams to score") ||
    normalized.includes("båda lagen gör mål") ||
    normalized.includes("over 2.5")
  ) {
    return false;
  }

  return (
    normalized.includes("over 1.5") ||
    normalized.includes("under 3.5") ||
    normalized === "home win" ||
    normalized === "hemmalag vinner" ||
    normalized.includes("both teams not to score") ||
    normalized.includes("båda lagen gör inte mål")
  );
}

export function passesValueBetSafetyGate(
  market: string,
  fairProbability: number,
  edgePercent: number
) {
  if (!normalizeToBettableMarket(market)) {
    return false;
  }

  if (!isHighConfidenceValueMarket(market)) {
    return false;
  }

  if (fairProbability < 58 || edgePercent < 4) {
    return false;
  }

  if (
    (/home win|hemmalag vinner/i.test(market) ||
      /both teams not to score|båda lagen gör inte mål/i.test(market)) &&
    fairProbability < 60
  ) {
    return false;
  }

  return true;
}

export function resolveValueBetTier(
  edgePercent: number,
  fairProbability: number
): ValueBetTier {
  if (edgePercent >= 9 && fairProbability >= 62) return 5;
  if (edgePercent >= 6 && fairProbability >= 58) return 4;
  if (edgePercent >= 4 && fairProbability >= 55) return 3;
  if (edgePercent >= 3 && fairProbability >= 52) return 2;

  return 1;
}

export type RankedValueBetPick = {
  edgePercent: number;
  fairProbability: number;
  market?: string;
  valueTier?: ValueBetTier;
  valueScore?: number;
  valueRank?: number;
};

export function rankValueBetPicks<T extends RankedValueBetPick>(
  picks: T[],
  maxPicks = 2
): Array<T & { valueTier: ValueBetTier; valueScore: number; valueRank: number }> {
  const graded = picks
    .filter(
      (pick) =>
        pick.market &&
        passesValueBetSafetyGate(
          pick.market,
          pick.fairProbability,
          pick.edgePercent
        )
    )
    .map((pick) => {
      const valueTier = resolveValueBetTier(
        pick.edgePercent,
        pick.fairProbability
      );
      const valueScore = calculateValueBetScore(
        pick.edgePercent,
        pick.fairProbability
      );

      return {
        ...pick,
        valueTier,
        valueScore,
      };
    });

  const filtered = graded.filter((pick) => pick.valueTier >= 4);

  return filtered
    .sort((a, b) => {
      if (b.fairProbability !== a.fairProbability) {
        return b.fairProbability - a.fairProbability;
      }

      if (b.valueTier !== a.valueTier) {
        return b.valueTier - a.valueTier;
      }

      if (b.valueScore !== a.valueScore) {
        return b.valueScore - a.valueScore;
      }

      return b.edgePercent - a.edgePercent;
    })
    .slice(0, maxPicks)
    .map((pick, index) => ({
      ...pick,
      valueRank: index + 1,
    }));
}
