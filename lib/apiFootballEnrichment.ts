import type { Language } from "@/lib/translations";

const FINISHED_STATUS = new Set(["FT", "AET", "PEN"]);
const STARTED_STATUS = new Set([
  "1H",
  "HT",
  "2H",
  "ET",
  "BT",
  "P",
  "SUSP",
  "INT",
  "LIVE",
  "FT",
  "AET",
  "PEN",
]);

export function unwrapTeamStats(stats: unknown) {
  if (Array.isArray(stats)) {
    return stats[0] || null;
  }

  return stats || null;
}

export function isMatchStarted(fixture: any) {
  return STARTED_STATUS.has(String(fixture?.fixture?.status?.short || ""));
}

export function pickFinishedFixtureIds(matches: any[], limit: number) {
  return (Array.isArray(matches) ? matches : [])
    .filter(
      (match) =>
        FINISHED_STATUS.has(String(match?.fixture?.status?.short || "")) &&
        match?.fixture?.id
    )
    .slice(0, limit)
    .map((match) => Number(match.fixture.id));
}

export function slimSeasonStats(stats: any) {
  const row = unwrapTeamStats(stats);

  if (!row) return null;

  return {
    form: row.form ?? null,
    played: row.fixtures?.played?.total ?? null,
    playedHome: row.fixtures?.played?.home ?? null,
    playedAway: row.fixtures?.played?.away ?? null,
    wins: row.fixtures?.wins?.total ?? null,
    winsHome: row.fixtures?.wins?.home ?? null,
    winsAway: row.fixtures?.wins?.away ?? null,
    draws: row.fixtures?.draws?.total ?? null,
    losses: row.fixtures?.loses?.total ?? null,
    goalsFor:
      row.goals?.for?.total?.total ?? row.goals?.for?.total ?? null,
    goalsAgainst:
      row.goals?.against?.total?.total ?? row.goals?.against?.total ?? null,
    goalsForAvg: row.goals?.for?.average?.total ?? null,
    goalsAgainstAvg: row.goals?.against?.average?.total ?? null,
    goalsForHome: row.goals?.for?.total?.home ?? null,
    goalsForAway: row.goals?.for?.total?.away ?? null,
    goalsAgainstHome: row.goals?.against?.total?.home ?? null,
    goalsAgainstAway: row.goals?.against?.total?.away ?? null,
    cleanSheets: row.clean_sheet?.total ?? null,
    cleanSheetsHome: row.clean_sheet?.home ?? null,
    failedToScore: row.failed_to_score?.total ?? null,
    failedToScoreAway: row.failed_to_score?.away ?? null,
    penaltyScored: row.penalty?.scored?.total ?? null,
    penaltyMissed: row.penalty?.missed?.total ?? null,
    formation: row.lineups?.[0]?.formation ?? null,
  };
}

function pair(value: any) {
  if (!value || typeof value !== "object") return null;

  return {
    home: value.home ?? null,
    away: value.away ?? null,
  };
}

export function slimPrediction(raw: any) {
  if (!raw) return null;

  const predictions = raw.predictions || raw;

  return {
    winner: predictions.winner
      ? {
          id: predictions.winner.id ?? null,
          name: predictions.winner.name ?? null,
          comment: predictions.winner.comment ?? null,
        }
      : null,
    winOrDraw: predictions.win_or_draw ?? null,
    underOver: predictions.under_over ?? null,
    advice: predictions.advice ?? null,
    percent: predictions.percent
      ? {
          home: predictions.percent.home ?? null,
          draw: predictions.percent.draw ?? null,
          away: predictions.percent.away ?? null,
        }
      : null,
    goals: predictions.goals
      ? {
          home: predictions.goals.home ?? null,
          away: predictions.goals.away ?? null,
        }
      : null,
    comparison: {
      form: pair(raw.comparison?.form),
      attack: pair(raw.comparison?.att),
      defense: pair(raw.comparison?.def),
      poisson: pair(raw.comparison?.poisson_distribution),
      h2h: pair(raw.comparison?.h2h),
      goals: pair(raw.comparison?.goals),
      total: pair(raw.comparison?.total),
    },
  };
}

export function slimFixtureStatistics(response: any[]) {
  if (!Array.isArray(response) || response.length === 0) {
    return [];
  }

  return response.map((item) => {
    const stats: Record<string, string | number | null> = {};

    for (const row of item?.statistics || []) {
      if (row?.type) {
        stats[row.type] = row.value ?? null;
      }
    }

    return {
      teamId: item?.team?.id ?? null,
      teamName: item?.team?.name ?? null,
      stats,
    };
  });
}

export function slimFixtureEvents(events: any[]) {
  return (Array.isArray(events) ? events : [])
    .filter((event) => /Goal|Card|Var/i.test(String(event?.type || "")))
    .slice(0, 24)
    .map((event) => ({
      time: event?.time?.elapsed ?? null,
      extra: event?.time?.extra ?? null,
      team: event?.team?.name ?? null,
      player: event?.player?.name ?? null,
      assist: event?.assist?.name ?? null,
      type: event?.type ?? null,
      detail: event?.detail ?? null,
    }));
}

export function slimLeagueLeaders(
  players: any[],
  kind: "goals" | "assists"
) {
  return (Array.isArray(players) ? players : []).slice(0, 8).map((item) => {
    const stats = item?.statistics?.[0];
    const value =
      kind === "goals" ? stats?.goals?.total : stats?.goals?.assists;

    return {
      id: item?.player?.id ?? null,
      name: item?.player?.name ?? null,
      photo: item?.player?.photo ?? null,
      team: stats?.team?.name ?? null,
      value: value ?? null,
    };
  });
}

export function filterActiveSidelined(
  items: any[],
  team: { id: number; name: string }
) {
  const today = new Date().toISOString().slice(0, 10);

  return (Array.isArray(items) ? items : [])
    .filter((item) => !item?.end || String(item.end) >= today)
    .slice(0, 16)
    .map((item) => ({
      player: {
        id: item?.player?.id,
        name: item?.player?.name,
        type: item?.type,
        reason: item?.type,
      },
      team: {
        id: team.id,
        name: team.name,
      },
      type: item?.type,
      reason: item?.type,
      start: item?.start ?? null,
      end: item?.end ?? null,
    }));
}

export function mergeAbsences(injuries: any[], extra: any[]) {
  const seen = new Set<string>();
  const merged: any[] = [];

  for (const item of [...(injuries || []), ...(extra || [])]) {
    const key = String(item?.player?.id || item?.player?.name || "").trim();

    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    merged.push(item);
  }

  return merged;
}

export type RecentMatchStatsPack = {
  fixtureId: number;
  stats: ReturnType<typeof slimFixtureStatistics>;
};

function statNumber(stats: Record<string, string | number | null>, key: string) {
  const raw = stats[key];
  const parsed = Number.parseFloat(String(raw ?? "").replace("%", ""));

  return Number.isFinite(parsed) ? parsed : null;
}

export function summarizeRecentMatchStats(
  packs: RecentMatchStatsPack[],
  homeTeamId: string | null,
  awayTeamId: string | null,
  language: Language
) {
  if (!packs.length) {
    return language === "en"
      ? "No recent match statistics available."
      : "Ingen färsk matchstatistik tillgänglig.";
  }

  const lines: string[] = [];

  for (const pack of packs) {
    if (!pack.stats.length) continue;

    const parts = pack.stats.map((team) => {
      const shots = statNumber(team.stats, "Total Shots");
      const onTarget = statNumber(team.stats, "Shots on Goal");
      const corners = statNumber(team.stats, "Corner Kicks");
      const possession = team.stats["Ball Possession"] ?? "?";
      const highlight =
        String(team.teamId) === String(homeTeamId) ||
        String(team.teamId) === String(awayTeamId)
          ? "*"
          : "";

      return `${highlight}${team.teamName}: shots ${shots ?? "?"}/${onTarget ?? "?"}, corners ${corners ?? "?"}, possession ${possession}`;
    });

    lines.push(`Fixture ${pack.fixtureId}: ${parts.join(" | ")}`);
  }

  if (lines.length === 0) {
    return language === "en"
      ? "No recent match statistics available."
      : "Ingen färsk matchstatistik tillgänglig.";
  }

  return lines.slice(0, 6).join("\n");
}

export function summarizePredictionForPrompt(
  prediction: ReturnType<typeof slimPrediction>,
  language: Language
) {
  if (!prediction) {
    return language === "en"
      ? "No API-Football prediction available for this fixture."
      : "Ingen API-Football-prediktion tillgänglig för matchen.";
  }

  const percent = prediction.percent;
  const comparison = prediction.comparison;
  const lines = [
    language === "en"
      ? "API-Football model (secondary signal, do not copy blindly):"
      : "API-Football-modell (sekundär signal, kopiera inte blint):",
    `Advice: ${prediction.advice || "–"}`,
    `Winner: ${prediction.winner?.name || "–"} (${prediction.winner?.comment || "–"})`,
    `Win or draw: ${prediction.winOrDraw ?? "–"}`,
    `Under/over: ${prediction.underOver || "–"}`,
    `Percents: home ${percent?.home ?? "–"} / draw ${percent?.draw ?? "–"} / away ${percent?.away ?? "–"}`,
    `Predicted goals: home ${prediction.goals?.home ?? "–"}, away ${prediction.goals?.away ?? "–"}`,
  ];

  if (comparison) {
    lines.push(
      `Comparison form ${comparison.form?.home ?? "–"} vs ${comparison.form?.away ?? "–"}`,
      `Attack ${comparison.attack?.home ?? "–"} vs ${comparison.attack?.away ?? "–"}`,
      `Defense ${comparison.defense?.home ?? "–"} vs ${comparison.defense?.away ?? "–"}`,
      `Poisson ${comparison.poisson?.home ?? "–"} vs ${comparison.poisson?.away ?? "–"}`,
      `H2H strength ${comparison.h2h?.home ?? "–"} vs ${comparison.h2h?.away ?? "–"}`
    );
  }

  return lines.join("\n");
}

export function summarizeFixtureStatsForPrompt(
  stats: ReturnType<typeof slimFixtureStatistics>,
  language: Language
) {
  if (!stats.length) {
    return language === "en"
      ? "Current fixture statistics are not available yet (match not started or not covered)."
      : "Matchstatistik för den här matchen saknas ännu (inte startad eller saknar täckning).";
  }

  return stats
    .map((team) => {
      const wanted = [
        "Ball Possession",
        "Total Shots",
        "Shots on Goal",
        "Corner Kicks",
        "Fouls",
        "Yellow Cards",
        "Red Cards",
        "Expected Goals",
        "xG",
      ];
      const bits = wanted
        .filter((key) => team.stats[key] != null)
        .map((key) => `${key}: ${team.stats[key]}`);

      return `${team.teamName}: ${bits.join(", ") || "–"}`;
    })
    .join("\n");
}

export function summarizeEventsForPrompt(
  events: ReturnType<typeof slimFixtureEvents>,
  language: Language
) {
  if (!events.length) {
    return language === "en"
      ? "No key match events yet."
      : "Inga nyckelhändelser ännu.";
  }

  return events
    .map((event) => {
      const minute =
        event.extra != null ? `${event.time}+${event.extra}` : event.time;
      return `${minute}' ${event.team}: ${event.detail || event.type} (${event.player || "–"})`;
    })
    .join("\n");
}

export function summarizeLeagueLeadersForPrompt(
  scorers: ReturnType<typeof slimLeagueLeaders>,
  assists: ReturnType<typeof slimLeagueLeaders>,
  language: Language
) {
  const format = (rows: ReturnType<typeof slimLeagueLeaders>) =>
    rows
      .slice(0, 5)
      .map((row) => `${row.name} (${row.team || "?"}): ${row.value ?? "?"}`)
      .join(", ") || "–";

  if (language === "en") {
    return `Top scorers: ${format(scorers)}\nTop assists: ${format(assists)}`;
  }

  return `Skytteliga: ${format(scorers)}\nAssistliga: ${format(assists)}`;
}

export function parsePredictionPercent(value: unknown) {
  const parsed = Number.parseFloat(String(value ?? "").replace("%", ""));

  return Number.isFinite(parsed) ? parsed : null;
}
