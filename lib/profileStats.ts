import type { WorthBettingVerdict } from "@/lib/worthBetting";

export type ProfileAnalysisRow = {
  id: string;
  created_at: string;
  match: string | null;
  score: number | null;
  risk: string | null;
  confidence: number | null;
  summary: string | null;
  markets?: unknown;
  worth_betting?: unknown;
};

export type NamedCount = {
  label: string;
  count: number;
};

export type WeekActivity = {
  key: string;
  label: string;
  count: number;
};

export type ProfileStats = {
  sampleSize: number;
  averageScore: number;
  averageConfidence: number;
  thisWeek: number;
  thisMonth: number;
  firstAnalysisAt: string | null;
  lastAnalysisAt: string | null;
  riskBuckets: NamedCount[];
  verdictBuckets: NamedCount[];
  topMatches: NamedCount[];
  topMarkets: NamedCount[];
  weekActivity: WeekActivity[];
};

const VERDICTS: WorthBettingVerdict[] = [
  "worth_it",
  "risky",
  "not_worth_it",
  "wait",
];

function isoWeekKey(date: Date) {
  const utc = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function normalizeRisk(value: string | null): "low" | "medium" | "high" | "other" {
  const text = (value || "").toLowerCase();

  if (
    text.includes("low") ||
    text.includes("lätt") ||
    text.includes("lägre") ||
    text.includes("easy")
  ) {
    return "low";
  }

  if (
    text.includes("high") ||
    text.includes("svår") ||
    text.includes("hög") ||
    text.includes("hard")
  ) {
    return "high";
  }

  if (text.includes("medium") || text.includes("medel") || text.includes("mid")) {
    return "medium";
  }

  return "other";
}

function marketLabel(item: unknown): string | null {
  if (typeof item === "string") {
    const trimmed = item.trim();
    return trimmed || null;
  }

  if (!item || typeof item !== "object") return null;

  const record = item as Record<string, unknown>;
  const value = record.label ?? record.market ?? record.name ?? record.title;

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }

  return null;
}

function extractMarkets(value: unknown): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map(marketLabel).filter((item): item is string => Boolean(item));
  }

  const single = marketLabel(value);
  return single ? [single] : [];
}

function extractVerdict(value: unknown): WorthBettingVerdict | null {
  if (!value || typeof value !== "object") return null;

  const verdict = (value as { verdict?: unknown }).verdict;

  if (typeof verdict === "string" && VERDICTS.includes(verdict as WorthBettingVerdict)) {
    return verdict as WorthBettingVerdict;
  }

  return null;
}

function topCounts(values: string[], limit: number): NamedCount[] {
  const counts = new Map<string, number>();

  for (const value of values) {
    counts.set(value, (counts.get(value) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

export function buildProfileStats(
  rows: ProfileAnalysisRow[],
  language: "sv" | "en"
): ProfileStats {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const scores = rows
    .map((row) => row.score)
    .filter((score): score is number => typeof score === "number");
  const confidences = rows
    .map((row) => row.confidence)
    .filter((score): score is number => typeof score === "number");

  const riskLabels = {
    sv: { low: "Lägre risk", medium: "Medel", high: "Högre risk", other: "Övrigt" },
    en: { low: "Lower risk", medium: "Medium", high: "Higher risk", other: "Other" },
  }[language];

  const riskCounts = { low: 0, medium: 0, high: 0, other: 0 };
  const verdictCounts: Record<WorthBettingVerdict, number> = {
    worth_it: 0,
    risky: 0,
    not_worth_it: 0,
    wait: 0,
  };

  const matches: string[] = [];
  const markets: string[] = [];
  const activity = new Map<string, number>();

  for (let i = 7; i >= 0; i -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - i * 7);
    const key = isoWeekKey(date);
    activity.set(key, 0);
  }

  for (const row of rows) {
    riskCounts[normalizeRisk(row.risk)] += 1;

    const verdict = extractVerdict(row.worth_betting);
    if (verdict) verdictCounts[verdict] += 1;

    if (row.match?.trim()) matches.push(row.match.trim());
    markets.push(...extractMarkets(row.markets));

    const created = new Date(row.created_at);
    const key = isoWeekKey(created);
    if (activity.has(key)) {
      activity.set(key, (activity.get(key) || 0) + 1);
    }
  }

  const createdDates = rows
    .map((row) => new Date(row.created_at).getTime())
    .filter((time) => Number.isFinite(time));

  const weekActivity: WeekActivity[] = [...activity.entries()].map(
    ([key, count]) => ({
      key,
      label: key.replace("-W", " v"),
      count,
    })
  );

  return {
    sampleSize: rows.length,
    averageScore: scores.length
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : 0,
    averageConfidence: confidences.length
      ? Math.round(
          confidences.reduce((sum, score) => sum + score, 0) / confidences.length
        )
      : 0,
    thisWeek: rows.filter((row) => new Date(row.created_at) >= weekAgo).length,
    thisMonth: rows.filter((row) => new Date(row.created_at) >= monthStart)
      .length,
    firstAnalysisAt: createdDates.length
      ? new Date(Math.min(...createdDates)).toISOString()
      : null,
    lastAnalysisAt: createdDates.length
      ? new Date(Math.max(...createdDates)).toISOString()
      : null,
    riskBuckets: (["low", "medium", "high", "other"] as const)
      .map((key) => ({ label: riskLabels[key], count: riskCounts[key] }))
      .filter((item) => item.count > 0),
    verdictBuckets: VERDICTS.map((key) => ({
      label: key,
      count: verdictCounts[key],
    })).filter((item) => item.count > 0),
    topMatches: topCounts(matches, 5),
    topMarkets: topCounts(markets, 6),
    weekActivity,
  };
}

export function displayNameFromEmail(email: string | null) {
  if (!email) return "";
  const local = email.split("@")[0] || email;
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function initialsFromEmail(email: string | null) {
  const name = (email || "").split("@")[0] || "";
  const parts = name.split(/[._-]+/).filter(Boolean);

  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  return name.slice(0, 2).toUpperCase() || "BS";
}
