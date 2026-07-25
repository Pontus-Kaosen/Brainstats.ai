import {
  addDaysToDateKey,
  getFixtureStockholmDateKey,
  getStockholmDateKey,
} from "@/lib/stockholmDate";
import {
  isAiDailySlipLeague,
  POPULAR_LEAGUE_IDS,
} from "@/lib/footballFixtures";
import type { DailySlipFixtureScope } from "@/lib/aiPrompts";

export type TodayFixture = {
  fixtureId: number;
  date: string;
  leagueId: number;
  league: string;
  country: string;
  homeTeam: string;
  awayTeam: string;
};

export type FixturePool = {
  fixtures: TodayFixture[];
  scope: DailySlipFixtureScope;
  referenceDateKey: string;
};

const EXCLUDED_LEAGUE_PATTERN =
  /\b(women|woman|women's|feminine|female|youth|u17|u18|u19|u20|u21|u23|reserve|reserves|academy|amateur)\b/i;

const POPULAR_LEAGUE_ID_SET = new Set(POPULAR_LEAGUE_IDS);

function isAllowedLeagueName(name: string) {
  return !EXCLUDED_LEAGUE_PATTERN.test(name);
}

export async function fetchFixturesForDate(
  dateKey: string,
  allowLeague: (leagueId: number, leagueName: string) => boolean
): Promise<TodayFixture[]> {
  const apiKey = process.env.API_FOOTBALL_KEY;

  if (!apiKey) {
    throw new Error("API_FOOTBALL_KEY saknas i .env.local.");
  }

  const query = new URLSearchParams({
    date: dateKey,
    timezone: "Europe/Stockholm",
  });

  const response = await fetch(
    `https://v3.football.api-sports.io/fixtures?${query.toString()}`,
    {
      headers: {
        "x-apisports-key": apiKey,
      },
      cache: "no-store",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error(
      `API-Football misslyckades för ${dateKey}:`,
      response.status,
      data
    );

    return [];
  }

  if (
    data?.errors &&
    typeof data.errors === "object" &&
    Object.keys(data.errors).length > 0
  ) {
    console.error(`API-Football-fel för ${dateKey}:`, data.errors);

    return [];
  }

  return (Array.isArray(data?.response) ? data.response : [])
    .filter((fixture: any) => {
      const status = fixture.fixture?.status?.short;

      return status === "NS" || status === "TBD";
    })
    .filter((fixture: any) => {
      const leagueId = fixture.league?.id;
      const leagueName = fixture.league?.name || "";

      return (
        fixture.fixture?.id &&
        fixture.fixture?.date &&
        leagueId &&
        allowLeague(leagueId, leagueName) &&
        fixture.teams?.home?.name &&
        fixture.teams?.away?.name &&
        getFixtureStockholmDateKey(fixture.fixture.date) === dateKey
      );
    })
    .sort(
      (a: any, b: any) =>
        new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
    )
    .slice(0, 60)
    .map((fixture: any) => ({
      fixtureId: fixture.fixture.id,
      date: fixture.fixture.date,
      leagueId: fixture.league.id,
      league: fixture.league?.name || "Okänd liga",
      country: fixture.league?.country || "Okänt land",
      homeTeam: fixture.teams.home.name,
      awayTeam: fixture.teams.away.name,
    }));
}

export async function resolveDailySlipFixtures(
  todayKey: string = getStockholmDateKey()
): Promise<FixturePool> {
  const majorToday = await fetchFixturesForDate(todayKey, (leagueId) =>
    isAiDailySlipLeague(leagueId)
  );

  if (majorToday.length > 0) {
    return {
      fixtures: majorToday,
      scope: "major_today",
      referenceDateKey: todayKey,
    };
  }

  const popularToday = await fetchFixturesForDate(
    todayKey,
    (leagueId) => POPULAR_LEAGUE_ID_SET.has(leagueId)
  );

  if (popularToday.length > 0) {
    return {
      fixtures: popularToday,
      scope: "popular_today",
      referenceDateKey: todayKey,
    };
  }

  const allToday = await fetchFixturesForDate(todayKey, (_leagueId, leagueName) =>
    isAllowedLeagueName(leagueName)
  );

  if (allToday.length > 0) {
    return {
      fixtures: allToday,
      scope: "all_today",
      referenceDateKey: todayKey,
    };
  }

  for (let offset = 1; offset <= 14; offset += 1) {
    const dateKey = addDaysToDateKey(todayKey, offset);
    const upcomingMajor = await fetchFixturesForDate(dateKey, (leagueId) =>
      isAiDailySlipLeague(leagueId)
    );

    if (upcomingMajor.length > 0) {
      return {
        fixtures: upcomingMajor,
        scope: "upcoming",
        referenceDateKey: dateKey,
      };
    }
  }

  return {
    fixtures: [],
    scope: "placeholder",
    referenceDateKey: todayKey,
  };
}

const VALUE_BET_WINDOW_MS = 24 * 60 * 60 * 1000;

function dedupeFixtures(fixtures: TodayFixture[]) {
  const seen = new Set<number>();

  return fixtures.filter((fixture) => {
    if (seen.has(fixture.fixtureId)) {
      return false;
    }

    seen.add(fixture.fixtureId);
    return true;
  });
}

function filterFixturesWithinNext24Hours(
  fixtures: TodayFixture[],
  nowMs: number = Date.now()
) {
  const cutoffMs = nowMs + VALUE_BET_WINDOW_MS;

  return fixtures.filter((fixture) => {
    const kickoffMs = new Date(fixture.date).getTime();

    if (!Number.isFinite(kickoffMs)) {
      return false;
    }

    return kickoffMs > nowMs && kickoffMs <= cutoffMs;
  });
}

async function fetchValueBetFixturesForWindow(
  todayKey: string,
  allowLeague: (leagueId: number, leagueName: string) => boolean
) {
  const tomorrowKey = addDaysToDateKey(todayKey, 1);
  const [todayFixtures, tomorrowFixtures] = await Promise.all([
    fetchFixturesForDate(todayKey, allowLeague),
    fetchFixturesForDate(tomorrowKey, allowLeague),
  ]);

  return filterFixturesWithinNext24Hours(
    dedupeFixtures([...todayFixtures, ...tomorrowFixtures])
  );
}

/** Value bets: scan matches kicking off within the next 24 hours. */
export async function resolveValueBetFixtures(
  todayKey: string = getStockholmDateKey()
): Promise<FixturePool> {
  const major = await fetchValueBetFixturesForWindow(todayKey, (leagueId) =>
    isAiDailySlipLeague(leagueId)
  );

  if (major.length > 0) {
    return {
      fixtures: major,
      scope: "value_24h",
      referenceDateKey: todayKey,
    };
  }

  const popular = await fetchValueBetFixturesForWindow(todayKey, (leagueId) =>
    POPULAR_LEAGUE_ID_SET.has(leagueId)
  );

  if (popular.length > 0) {
    return {
      fixtures: popular,
      scope: "value_24h",
      referenceDateKey: todayKey,
    };
  }

  const all = await fetchValueBetFixturesForWindow(
    todayKey,
    (_leagueId, leagueName) => isAllowedLeagueName(leagueName)
  );

  if (all.length > 0) {
    return {
      fixtures: all,
      scope: "value_24h",
      referenceDateKey: todayKey,
    };
  }

  return {
    fixtures: [],
    scope: "placeholder",
    referenceDateKey: todayKey,
  };
}
