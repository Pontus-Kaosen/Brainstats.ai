export type LineupPlayer = {
  id?: number;
  name?: string;
  number?: number;
  position?: string;
  grid?: string;
};

export type TeamLineup = {
  team?: {
    id?: number;
    name?: string;
    logo?: string;
    colors?: unknown;
  };
  formation?: string | null;
  coach?: {
    id?: number;
    name?: string;
    photo?: string;
  };
  startXI?: LineupPlayer[];
  substitutes?: LineupPlayer[];
};

export type PlayerLineupStatus =
  | "starting"
  | "bench"
  | "not_in_squad"
  | "unknown";

export function normalizeTeamLineup(teamLineup: any): TeamLineup {
  return {
    team: {
      id: teamLineup.team?.id,
      name: teamLineup.team?.name,
      logo: teamLineup.team?.logo,
      colors: teamLineup.team?.colors || null,
    },
    formation: teamLineup.formation || null,
    coach: {
      id: teamLineup.coach?.id,
      name: teamLineup.coach?.name,
      photo: teamLineup.coach?.photo,
    },
    startXI: (teamLineup.startXI || []).map((item: any) => ({
      id: item.player?.id,
      name: item.player?.name,
      number: item.player?.number,
      position: item.player?.pos,
      grid: item.player?.grid,
    })),
    substitutes: (teamLineup.substitutes || []).map((item: any) => ({
      id: item.player?.id,
      name: item.player?.name,
      number: item.player?.number,
      position: item.player?.pos,
      grid: item.player?.grid,
    })),
  };
}

export function orderLineupsForFixture(
  lineups: TeamLineup[],
  homeTeamId?: number | string | null,
  awayTeamId?: number | string | null
) {
  if (lineups.length === 0) {
    return [];
  }

  const homeId = homeTeamId != null ? String(homeTeamId) : null;
  const awayId = awayTeamId != null ? String(awayTeamId) : null;

  const homeLineup = homeId
    ? lineups.find((lineup) => String(lineup.team?.id) === homeId)
    : undefined;
  const awayLineup = awayId
    ? lineups.find((lineup) => String(lineup.team?.id) === awayId)
    : undefined;

  const ordered: TeamLineup[] = [];

  if (homeLineup) {
    ordered.push(homeLineup);
  }

  if (awayLineup && awayLineup !== homeLineup) {
    ordered.push(awayLineup);
  }

  for (const lineup of lineups) {
    if (!ordered.includes(lineup)) {
      ordered.push(lineup);
    }
  }

  return ordered;
}

export function getLineupForTeam(
  lineups: TeamLineup[],
  teamId?: number | string | null
) {
  if (teamId == null) {
    return undefined;
  }

  return lineups.find(
    (lineup) => String(lineup.team?.id) === String(teamId)
  );
}

export function hasPublishedLineup(lineup?: TeamLineup | null) {
  return (lineup?.startXI?.length ?? 0) > 0;
}

export function areLineupsConfirmed(lineups: TeamLineup[]) {
  const withStarters = lineups.filter((lineup) =>
    hasPublishedLineup(lineup)
  );

  return (
    withStarters.length >= 2 &&
    withStarters.every((lineup) => (lineup.startXI?.length ?? 0) >= 11)
  );
}

export function hasPartialLineups(lineups: TeamLineup[]) {
  return lineups.some((lineup) => hasPublishedLineup(lineup));
}

export function getPlayerLineupStatus(
  playerId: number | string | null | undefined,
  lineups: TeamLineup[],
  teamId?: number | string | null
): PlayerLineupStatus {
  if (!playerId) {
    return "unknown";
  }

  const relevantLineups = teamId
    ? [getLineupForTeam(lineups, teamId)].filter(Boolean)
    : lineups;

  if (relevantLineups.length === 0) {
    return "unknown";
  }

  const hasAnyPublishedLineup = relevantLineups.some((lineup) =>
    hasPublishedLineup(lineup)
  );

  if (!hasAnyPublishedLineup) {
    return "unknown";
  }

  const playerKey = String(playerId);

  for (const lineup of relevantLineups) {
    if (
      (lineup?.startXI || []).some(
        (player) => String(player.id) === playerKey
      )
    ) {
      return "starting";
    }
  }

  for (const lineup of relevantLineups) {
    if (
      (lineup?.substitutes || []).some(
        (player) => String(player.id) === playerKey
      )
    ) {
      return "bench";
    }
  }

  return "not_in_squad";
}

export function describePlayerLineupStatus(
  status: PlayerLineupStatus,
  language: "sv" | "en"
) {
  if (language === "en") {
    switch (status) {
      case "starting":
        return "STARTING — player is in the confirmed starting XI.";
      case "bench":
        return "BENCH — player is listed as a substitute, not in the starting XI.";
      case "not_in_squad":
        return "NOT IN SQUAD — player is not in the published matchday squad.";
      default:
        return "UNKNOWN — lineups are not published yet or could not be verified.";
    }
  }

  switch (status) {
    case "starting":
      return "STARTAR — spelaren finns i bekräftad startelva.";
    case "bench":
      return "BÄNK — spelaren är avbytare, inte i startelvan.";
    case "not_in_squad":
      return "EJ I TRUPP — spelaren finns inte i publicerad matchtrupp.";
    default:
      return "OKÄNT — startelvor är inte publicerade än eller kunde inte verifieras.";
  }
}

export function getPlayerLineupStatusLabel(
  status: PlayerLineupStatus,
  language: "sv" | "en"
) {
  if (language === "en") {
    switch (status) {
      case "starting":
        return "In starting XI";
      case "bench":
        return "On the bench";
      case "not_in_squad":
        return "Not in squad";
      default:
        return "Lineups not published";
    }
  }

  switch (status) {
    case "starting":
      return "I startelvan";
    case "bench":
      return "På bänken";
    case "not_in_squad":
      return "Ej i trupp";
    default:
      return "Elva ej publicerad";
  }
}
