import type { Language, Translations } from "@/lib/translations";

export function getLocale(language: Language) {
  return language === "sv" ? "sv-SE" : "en-US";
}

export function translateSlipRisk(risk: string, t: Translations) {
  if (
    risk === "Lägre risk" ||
    risk === "Lower risk" ||
    risk === "Low"
  ) {
    return t.aiBetSlip.riskLow;
  }

  if (
    risk === "Högre risk" ||
    risk === "Higher risk" ||
    risk === "High"
  ) {
    return t.aiBetSlip.riskHigh;
  }

  if (
    risk === "Balanserad" ||
    risk === "Balanced" ||
    risk === "Value" ||
    risk === "Special" ||
    risk === "Medium"
  ) {
    return t.aiBetSlip.riskBalanced;
  }

  return risk;
}

export function translateRiskLevel(
  risk: string | undefined,
  t: Translations
) {
  if (!risk || risk === "Unknown" || risk === "Okänd") {
    return t.common.riskUnknown;
  }

  if (risk === "Low" || risk === "Lägre risk" || risk === "Lower risk") {
    return t.common.riskLow;
  }

  if (risk === "High" || risk === "Högre risk" || risk === "Higher risk") {
    return t.common.riskHigh;
  }

  if (
    risk === "Medium" ||
    risk === "Medel risk" ||
    risk === "Balanserad" ||
    risk === "Balanced" ||
    risk === "Value" ||
    risk === "Special"
  ) {
    return t.common.riskMedium;
  }

  return translateSlipRisk(risk, t);
}

export function translateBreakdownKey(key: string, t: Translations) {
  const labels = t.scoreBreakdown as Record<string, string>;
  return labels[key] ?? key;
}

export function formatTranslation(
  template: string,
  values: Record<string, string | number>
) {
  return Object.entries(values).reduce(
    (result, [key, value]) =>
      result.replace(`{${key}}`, String(value)),
    template
  );
}
