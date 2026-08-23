import type {
  AnalysisUsedData,
  Injury,
  LastMatch,
  SeasonRecordSnapshot,
  TableRowSnapshot,
  TeamLineup,
  Weather,
} from "@/lib/analysisReportTypes";

export function readWeather(weather: AnalysisUsedData["weather"]): Weather | null {
  if (!weather) return null;

  const temperature = weather.temperature ?? weather.temp;
  const description = weather.description ?? weather.condition;
  const wind = weather.wind ?? weather.windSpeed;
  const humidity = weather.humidity;

  if (
    temperature == null &&
    !description &&
    wind == null &&
    humidity == null
  ) {
    return null;
  }

  return {
    city: weather.city,
    temperature,
    description,
    wind,
    humidity,
  };
}

export function readLineupStarters(lineup: TeamLineup | undefined) {
  if (!lineup) return [];
  return lineup.startXI || [];
}

export function readLastMatches(
  usedData: AnalysisUsedData,
  side: "home" | "away"
): LastMatch[] {
  const nested = usedData.lastMatches?.[side];
  if (Array.isArray(nested) && nested.length > 0) {
    return nested;
  }

  const flat =
    side === "home" ? usedData.homeLastMatches : usedData.awayLastMatches;

  return Array.isArray(flat) ? flat : [];
}

export function readInjuries(usedData: AnalysisUsedData): Injury[] {
  return usedData.injuries || [];
}

export function readRotationRisks(usedData: AnalysisUsedData) {
  return usedData.rotationRisks || [];
}

export function readScheduleContext(usedData: AnalysisUsedData) {
  return usedData.scheduleContext ?? null;
}

export function readH2H(usedData: AnalysisUsedData): LastMatch[] {
  const items = usedData.h2h || usedData.headToHead || [];
  return Array.isArray(items) ? items : [];
}

export function formResultForTeam(match: LastMatch, teamId?: string | null) {
  const homeGoals = match.goals?.home;
  const awayGoals = match.goals?.away;

  if (homeGoals == null || awayGoals == null) {
    return "–";
  }

  if (homeGoals === awayGoals) return "D";

  if (!teamId) {
    if (match.teams.home.winner) return "W";
    if (match.teams.away.winner) return "L";
    return homeGoals > awayGoals ? "W" : "L";
  }

  const isHome = String(match.teams.home.id ?? "") === String(teamId);
  const teamWon = isHome ? homeGoals > awayGoals : awayGoals > homeGoals;
  return teamWon ? "W" : "L";
}

export function standingLine(row?: TableRowSnapshot | null) {
  if (!row) return null;

  const parts = [
    row.rank != null ? `#${row.rank}` : null,
    row.points != null ? `${row.points}p` : null,
    row.played != null ? `${row.played} m` : null,
    row.form ? row.form : null,
  ].filter(Boolean);

  return parts.join(" · ");
}

export function seasonLine(stats?: SeasonRecordSnapshot | null) {
  if (!stats) return null;

  const record =
    stats.wins != null
      ? `${stats.wins}-${stats.draws ?? 0}-${stats.losses ?? 0}`
      : null;

  const goals =
    stats.goalsFor != null
      ? `${stats.goalsFor}-${stats.goalsAgainst ?? "?"}`
      : null;

  return [record, goals, stats.form].filter(Boolean).join(" · ");
}
