export const LIVE_STATUSES = new Set([
  "1H",
  "HT",
  "2H",
  "ET",
  "BT",
  "P",
  "SUSP",
  "INT",
  "LIVE",
]);

export const UPCOMING_STATUSES = new Set(["NS", "TBD", "PST"]);

export const CANCELLED_STATUSES = new Set(["CANC", "ABD", "AWD", "WO"]);

export const FINISHED_STATUSES = new Set([
  "FT",
  "AET",
  "PEN",
  "AWD",
  "WO",
]);

export type MappedFixture = {
  fixture: {
    id: number;
    date: string;
    referee?: string | null;
    venue?: {
      name?: string | null;
      city?: string | null;
    } | null;
    status?: {
      short?: string;
      long?: string;
      elapsed?: number | null;
    };
  };
  league: {
    id: number;
    season: number;
    name: string;
    logo?: string;
    country?: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo?: string;
    };
    away: {
      id: number;
      name: string;
      logo?: string;
    };
  };
  goals?: {
    home: number | null;
    away: number | null;
  };
  score?: unknown;
};

export function mapApiFixtureItem(item: any): MappedFixture {
  return {
    fixture: {
      id: item.fixture.id,
      date: item.fixture.date,
      referee: item.fixture.referee,
      venue: item.fixture.venue,
      status: item.fixture.status,
    },
    league: {
      id: item.league.id,
      season: item.league.season,
      name: item.league.name,
      logo: item.league.logo,
      country: item.league.country,
    },
    teams: {
      home: {
        id: item.teams.home.id,
        name: item.teams.home.name,
        logo: item.teams.home.logo,
      },
      away: {
        id: item.teams.away.id,
        name: item.teams.away.name,
        logo: item.teams.away.logo,
      },
    },
    goals: item.goals,
    score: item.score,
  };
}

export const POPULAR_LEAGUE_IDS = [
  39, 140, 135, 78, 61, 2, 3, 848, 94, 88, 144, 179, 203, 253, 71, 128,
];

/** Top leagues shown immediately in Brain Builder (today/tomorrow). */
export const MAJOR_LEAGUE_IDS = [39, 140, 135, 78, 61, 113, 2, 3];

export function isMajorLeague(leagueId: number) {
  return MAJOR_LEAGUE_IDS.includes(leagueId);
}

export function partitionLeagueGroups<
  T extends { league: { id: number }; fixtures: unknown[] },
>(groups: T[]) {
  const majorGroups: T[] = [];
  const otherGroups: T[] = [];

  for (const group of groups) {
    if (isMajorLeague(group.league.id)) {
      majorGroups.push(group);
    } else {
      otherGroups.push(group);
    }
  }

  return { majorGroups, otherGroups };
}

export function sortFixturesByKickoff<T extends { fixture: { date: string } }>(
  fixtures: T[]
) {
  return [...fixtures].sort(
    (a, b) =>
      new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
  );
}

export function groupFixturesByLeague<
  T extends {
    fixture: { id: number; date: string };
    league: { id: number; name: string; logo?: string; country?: string };
  },
>(fixtures: T[]) {
  const groups = new Map<
    number,
    {
      league: T["league"];
      fixtures: T[];
    }
  >();

  for (const fixture of fixtures) {
    const existing = groups.get(fixture.league.id);

    if (existing) {
      existing.fixtures.push(fixture);
      continue;
    }

    groups.set(fixture.league.id, {
      league: fixture.league,
      fixtures: [fixture],
    });
  }

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      fixtures: sortFixturesByKickoff(group.fixtures),
    }))
    .sort((a, b) => {
      const aIndex = POPULAR_LEAGUE_IDS.indexOf(a.league.id);
      const bIndex = POPULAR_LEAGUE_IDS.indexOf(b.league.id);

      if (aIndex !== -1 || bIndex !== -1) {
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      }

      return a.league.name.localeCompare(b.league.name, "sv");
    });
}
