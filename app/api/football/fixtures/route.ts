import {
  NextRequest,
  NextResponse,
} from "next/server";
import { fetchFootballApi, jsonWithCache } from "@/lib/footballApiFetch";

const LIVE_STATUSES = new Set([
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

const UPCOMING_STATUSES = new Set([
  "NS",
  "TBD",
  "PST",
]);

export async function GET(
  request: NextRequest
) {
  const controller = new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    25000
  );

  try {
    const { searchParams } = new URL(
      request.url
    );

    const league =
      searchParams.get("league");

    const season =
      searchParams.get("season");

    if (!league || !season) {
      return NextResponse.json(
        {
          success: false,
          error:
            "League och season måste anges.",
          fixtures: [],
        },
        { status: 400 }
      );
    }

    const apiKey =
      process.env.API_FOOTBALL_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            "API_FOOTBALL_KEY saknas.",
          fixtures: [],
        },
        { status: 500 }
      );
    }

    const query = new URLSearchParams({
      league,
      season,
      timezone: "Europe/Stockholm",
    });

    const response = await fetchFootballApi(
      `fixtures?${query.toString()}`,
      120,
      { signal: controller.signal }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Football API svarade med ${response.status}.`,
          apiErrors:
            data?.errors || null,
          fixtures: [],
        },
        { status: response.status }
      );
    }

    if (
      data?.errors &&
      typeof data.errors === "object" &&
      Object.keys(data.errors).length > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Football API returnerade ett fel.",
          apiErrors: data.errors,
          fixtures: [],
        },
        { status: 502 }
      );
    }

    const now = Date.now();

    const fixtures = (
      Array.isArray(data.response)
        ? data.response
        : []
    )
      .map((item: any) => ({
        fixture: {
          id: item.fixture.id,
          date: item.fixture.date,
          referee:
            item.fixture.referee,
          venue:
            item.fixture.venue,
          status:
            item.fixture.status,
        },

        league: {
          id: item.league.id,
          name: item.league.name,
          logo: item.league.logo,
          country:
            item.league.country,
          season:
            item.league.season,
          round:
            item.league.round,
        },

        teams: {
          home: {
            id: item.teams.home.id,
            name:
              item.teams.home.name,
            logo:
              item.teams.home.logo,
            winner:
              item.teams.home.winner,
          },

          away: {
            id: item.teams.away.id,
            name:
              item.teams.away.name,
            logo:
              item.teams.away.logo,
            winner:
              item.teams.away.winner,
          },
        },

        goals: item.goals,
        score: item.score,
      }))
      .filter((item: any) => {
        const status =
          item.fixture.status?.short || "";

        const kickoff = new Date(
          item.fixture.date
        ).getTime();

        const isLive =
          LIVE_STATUSES.has(status);

        const isUpcoming =
          UPCOMING_STATUSES.has(status) &&
          kickoff >= now - 3 * 60 * 60 * 1000;

        return isLive || isUpcoming;
      })
      .sort((a: any, b: any) => {
        const aStatus =
          a.fixture.status?.short || "";

        const bStatus =
          b.fixture.status?.short || "";

        const aLive =
          LIVE_STATUSES.has(aStatus);

        const bLive =
          LIVE_STATUSES.has(bStatus);

        if (aLive && !bLive) return -1;
        if (!aLive && bLive) return 1;

        return (
          new Date(
            a.fixture.date
          ).getTime() -
          new Date(
            b.fixture.date
          ).getTime()
        );
      })
      .slice(0, 100);

    return jsonWithCache(
      {
        success: true,
        league: Number(league),
        season: Number(season),
        count: fixtures.length,
        fixtures,
        apiErrors: data?.errors || null,
      },
      120
    );
  } catch (error: unknown) {
    const aborted =
      error instanceof Error &&
      error.name === "AbortError";

    return NextResponse.json(
      {
        success: false,
        error: aborted
          ? "Matchhämtningen tog för lång tid."
          : error instanceof Error
            ? error.message
            : String(error),
        fixtures: [],
      },
      {
        status: aborted ? 504 : 500,
      }
    );
  } finally {
    clearTimeout(timeout);
  }
}