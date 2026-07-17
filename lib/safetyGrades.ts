import type { Language } from "@/lib/translations";

export type SafetyTier = 1 | 2 | 3 | 4 | 5;

export type SafetyGrade = {
  tier: SafetyTier;
  labelSv: string;
  labelEn: string;
  descriptionSv: string;
  descriptionEn: string;
};

export const SAFETY_GRADES: SafetyGrade[] = [
  {
    tier: 1,
    labelSv: "Lätt",
    labelEn: "Easy",
    descriptionSv: "Mest konservativ profil — högst sannolikhet per val.",
    descriptionEn: "Most conservative profile — highest probability per pick.",
  },
  {
    tier: 2,
    labelSv: "Medel-lätt",
    labelEn: "Fairly easy",
    descriptionSv: "Balanserad men försiktig — stabil grundkupong.",
    descriptionEn: "Balanced but cautious — stable base slip.",
  },
  {
    tier: 3,
    labelSv: "Medel",
    labelEn: "Medium",
    descriptionSv: "Normal svårighetsgrad — mix av sannolikhet och value.",
    descriptionEn: "Normal difficulty — mix of probability and value.",
  },
  {
    tier: 4,
    labelSv: "Svår",
    labelEn: "Hard",
    descriptionSv: "Högre risk/reward — kräver mer marginal.",
    descriptionEn: "Higher risk/reward — needs more edge.",
  },
  {
    tier: 5,
    labelSv: "Väldigt svår",
    labelEn: "Very hard",
    descriptionSv: "Specialkupong — lägst sannolikhet, högst potential.",
    descriptionEn: "Special slip — lowest probability, highest upside.",
  },
];

function clampTier(value: number): SafetyTier {
  if (value <= 1) return 1;
  if (value >= 5) return 5;
  return value as SafetyTier;
}

export function getSafetyGrade(
  tier: number,
  language: Language
): SafetyGrade & { label: string; description: string } {
  const grade = SAFETY_GRADES[clampTier(tier) - 1];

  return {
    ...grade,
    label: language === "en" ? grade.labelEn : grade.labelSv,
    description: language === "en" ? grade.descriptionEn : grade.descriptionSv,
  };
}

const LEGACY_RISK_TO_TIER: Record<string, SafetyTier> = {
  "lätt": 1,
  easy: 1,
  "lägre risk": 1,
  "lower risk": 1,
  low: 1,
  "medel-lätt": 2,
  "fairly easy": 2,
  balanserad: 2,
  balanced: 2,
  medel: 3,
  medium: 3,
  value: 3,
  svår: 4,
  hard: 4,
  "högre risk": 4,
  "higher risk": 4,
  high: 4,
  "väldigt svår": 5,
  "very hard": 5,
  special: 5,
};

export function resolveSafetyTier(input: {
  slipIndex?: number | null;
  risk?: string | null;
  title?: string | null;
}): SafetyTier {
  if (typeof input.slipIndex === "number" && input.slipIndex >= 1) {
    return clampTier(input.slipIndex);
  }

  const candidates = [input.risk, input.title]
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim().toLowerCase());

  for (const candidate of candidates) {
    if (LEGACY_RISK_TO_TIER[candidate]) {
      return LEGACY_RISK_TO_TIER[candidate];
    }
  }

  return 3;
}

export function sortSlipsBySafety<T extends { slip_index?: number; risk?: string; title?: string }>(
  slips: T[]
): T[] {
  return [...slips].sort(
    (a, b) =>
      resolveSafetyTier({
        slipIndex: a.slip_index,
        risk: a.risk,
        title: a.title,
      }) -
      resolveSafetyTier({
        slipIndex: b.slip_index,
        risk: b.risk,
        title: b.title,
      })
  );
}

export function getOutcomeLabelForTier(
  tier: SafetyTier,
  outcome: "won" | "lost" | "void" | "pending",
  language: Language
): string | null {
  if (outcome !== "lost") return null;

  const grade = getSafetyGrade(tier, language);

  if (language === "en") {
    return `Miss at ${grade.label} level`;
  }

  return `Miss på nivå: ${grade.label}`;
}
