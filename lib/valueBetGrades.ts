import type { Language } from "@/lib/translations";

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
  return Number((edgePercent * 0.55 + fairProbability * 0.45).toFixed(2));
}

export function resolveValueBetTier(
  edgePercent: number,
  fairProbability: number
): ValueBetTier {
  if (edgePercent >= 12 && fairProbability >= 58) return 5;
  if (edgePercent >= 8 && fairProbability >= 52) return 4;
  if (edgePercent >= 5 && fairProbability >= 48) return 3;
  if (edgePercent >= 3 && fairProbability >= 42) return 2;

  return 1;
}

export type RankedValueBetPick = {
  edgePercent: number;
  fairProbability: number;
  valueTier?: ValueBetTier;
  valueScore?: number;
  valueRank?: number;
};

export function rankValueBetPicks<T extends RankedValueBetPick>(
  picks: T[],
  maxPicks = 5
): Array<T & { valueTier: ValueBetTier; valueScore: number; valueRank: number }> {
  const graded = picks.map((pick) => {
    const valueTier = resolveValueBetTier(pick.edgePercent, pick.fairProbability);
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

  let filtered = graded.filter((pick) => pick.valueTier >= 4);

  if (filtered.length === 0) {
    filtered = graded.filter((pick) => pick.valueTier >= 3);
  }

  return filtered
    .sort((a, b) => {
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
