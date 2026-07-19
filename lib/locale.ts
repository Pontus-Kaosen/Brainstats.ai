import {
  addDaysToDateKey,
  getFixtureStockholmDateKey,
  getStockholmDateKey,
} from "@/lib/stockholmDate";
import type { Language, Translations } from "@/lib/translations";

export function getLocale(language: Language) {
  return language === "sv" ? "sv-SE" : "en-US";
}

export function formatStockholmKickoffTime(
  kickoffAt: string,
  language: Language
) {
  return new Intl.DateTimeFormat(getLocale(language), {
    timeZone: "Europe/Stockholm",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(kickoffAt));
}

export function formatKickoffLabel(
  kickoffAt: string | undefined,
  referenceDateKey: string,
  language: Language,
  t: Translations
) {
  if (!kickoffAt) {
    return undefined;
  }

  const kickoffDateKey = getFixtureStockholmDateKey(kickoffAt);
  const time = formatStockholmKickoffTime(kickoffAt, language);

  if (kickoffDateKey === referenceDateKey) {
    return formatTranslation(t.aiBetSlip.kickoffToday, { time });
  }

  if (kickoffDateKey === addDaysToDateKey(referenceDateKey, 1)) {
    return formatTranslation(t.aiBetSlip.kickoffTomorrow, { time });
  }

  const weekday = new Intl.DateTimeFormat(getLocale(language), {
    timeZone: "Europe/Stockholm",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(kickoffAt));

  return formatTranslation(t.aiBetSlip.kickoffDate, {
    date: weekday,
    time,
  });
}

export function translateSlipRisk(risk: string, t: Translations) {
  if (
    risk === "Lätt" ||
    risk === "Easy" ||
    risk === "Lägre risk" ||
    risk === "Lower risk" ||
    risk === "Low"
  ) {
    return t.aiBetSlip.riskLow;
  }

  if (
    risk === "Medel-lätt" ||
    risk === "Fairly easy" ||
    risk === "Balanserad" ||
    risk === "Balanced"
  ) {
    return t.aiBetSlip.riskFairlyEasy;
  }

  if (
    risk === "Medel" ||
    risk === "Medium" ||
    risk === "Value"
  ) {
    return t.aiBetSlip.riskBalanced;
  }

  if (
    risk === "Svår" ||
    risk === "Hard" ||
    risk === "Högre risk" ||
    risk === "Higher risk" ||
    risk === "High"
  ) {
    return t.aiBetSlip.riskHard;
  }

  if (
    risk === "Väldigt svår" ||
    risk === "Very hard" ||
    risk === "Special"
  ) {
    return t.aiBetSlip.riskHigh;
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
