import { fetchFootballApi } from "@/lib/footballApiFetch";

export type ExtractedBetPick = {
  homeTeam: string;
  awayTeam: string;
  market: string;
  playerName?: string | null;
};

type ApiTeam = {
  team?: {
    id?: number;
    name?: string;
  };
};

type ApiFixture = {
  fixture?: { id?: number; date?: string };
  league?: { id?: number; season?: number };
  teams?: {
    home?: { id?: number; name?: string };
    away?: { id?: number; name?: string };
  };
};

async function searchTeam(name: string) {
  const trimmed = name.trim();

  if (!trimmed) {
    return null;
  }

  const response = await fetchFootballApi(
    `teams?search=${encodeURIComponent(trimmed)}`,
    3600
  );
  const data = await response.json();
  const teams = (data.response || []) as ApiTeam[];

  if (teams.length === 0) {
    return null;
  }

  const normalized = trimmed.toLowerCase();
  const exact = teams.find(
    (item) => item.team?.name?.toLowerCase() === normalized
  );

  if (exact?.team?.id) {
    return exact.team;
  }

  const contains = teams.find((item) =>
    item.team?.name?.toLowerCase().includes(normalized)
  );

  return contains?.team?.id ? contains.team : teams[0]?.team || null;
}

async function findFixtureBetweenTeams(homeTeamId: number, awayTeamId: number) {
  const response = await fetchFootballApi(
    `fixtures?team=${homeTeamId}&next=25`,
    300
  );
  const data = await response.json();
  const fixtures = (data.response || []) as ApiFixture[];

  const direct = fixtures.find(
    (fixture) =>
      fixture.teams?.home?.id &&
      fixture.teams?.away?.id &&
      ((fixture.teams.home.id === homeTeamId &&
        fixture.teams.away.id === awayTeamId) ||
        (fixture.teams.home.id === awayTeamId &&
          fixture.teams.away.id === homeTeamId))
  );

  if (direct) {
    return direct;
  }

  const reverseResponse = await fetchFootballApi(
    `fixtures?team=${awayTeamId}&next=25`,
    300
  );
  const reverseData = await reverseResponse.json();
  const reverseFixtures = (reverseData.response || []) as ApiFixture[];

  return (
    reverseFixtures.find(
      (fixture) =>
        fixture.teams?.home?.id &&
        fixture.teams?.away?.id &&
        ((fixture.teams.home.id === homeTeamId &&
          fixture.teams.away.id === awayTeamId) ||
          (fixture.teams.home.id === awayTeamId &&
            fixture.teams.away.id === homeTeamId))
    ) || null
  );
}

function normalizePickTeams(pick: ExtractedBetPick, fixture: ApiFixture) {
  const homeName = fixture.teams?.home?.name || pick.homeTeam;
  const awayName = fixture.teams?.away?.name || pick.awayTeam;

  return {
    homeTeam: homeName,
    awayTeam: awayName,
    homeTeamId: fixture.teams?.home?.id || null,
    awayTeamId: fixture.teams?.away?.id || null,
    fixtureId: fixture.fixture?.id || null,
  };
}

export function buildAnalyzeTextBlock(options: {
  homeTeam: string;
  awayTeam: string;
  market: string;
  fixtureId?: number | null;
  homeTeamId?: number | null;
  awayTeamId?: number | null;
  playerName?: string | null;
  playerId?: number | null;
}) {
  const lines = [`${options.homeTeam} - ${options.awayTeam}`, options.market];

  if (options.fixtureId) {
    lines.push(`Fixture ID: ${options.fixtureId}`);
  }

  if (options.homeTeamId) {
    lines.push(`Home Team ID: ${options.homeTeamId}`);
  }

  if (options.awayTeamId) {
    lines.push(`Away Team ID: ${options.awayTeamId}`);
  }

  if (options.playerId) {
    lines.push(`Player ID: ${options.playerId}`);
  }

  if (options.playerName) {
    lines.push(`Player Name: ${options.playerName}`);
  }

  return lines.join("\n");
}

export async function resolvePicksToAnalyzeText(picks: ExtractedBetPick[]) {
  if (picks.length === 0) {
    return {
      text: "",
      resolved: false,
      warning: null as string | null,
    };
  }

  const primary = picks[0];
  const homeTeam = await searchTeam(primary.homeTeam);
  const awayTeam = await searchTeam(primary.awayTeam);

  let fixture: ApiFixture | null = null;

  if (homeTeam?.id && awayTeam?.id) {
    fixture = await findFixtureBetweenTeams(homeTeam.id, awayTeam.id);
  }

  const blocks: string[] = [];
  const uniqueMatches = new Set(
    picks.map((pick) => `${pick.homeTeam}::${pick.awayTeam}`)
  );

  if (fixture?.fixture?.id) {
    const matchMeta = normalizePickTeams(primary, fixture);

    for (const pick of picks) {
      blocks.push(
        buildAnalyzeTextBlock({
          homeTeam: matchMeta.homeTeam,
          awayTeam: matchMeta.awayTeam,
          market: pick.market,
          fixtureId: matchMeta.fixtureId,
          homeTeamId: matchMeta.homeTeamId,
          awayTeamId: matchMeta.awayTeamId,
          playerName: pick.playerName || null,
        })
      );
    }

    return {
      text: blocks.join("\n\n"),
      resolved: true,
      warning:
        uniqueMatches.size > 1 ? "multiple_matches" : null,
    };
  }

  for (const pick of picks) {
    blocks.push(
      buildAnalyzeTextBlock({
        homeTeam: pick.homeTeam,
        awayTeam: pick.awayTeam,
        market: pick.market,
        playerName: pick.playerName || null,
      })
    );
  }

  return {
    text: blocks.join("\n\n"),
    resolved: false,
    warning: "fixture_not_found",
  };
}
