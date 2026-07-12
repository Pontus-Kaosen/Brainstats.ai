import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiKey = process.env.API_FOOTBALL_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          count: 0,
          fixtures: [],
          error: "API_FOOTBALL_KEY saknas.",
        },
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://v3.football.api-sports.io/fixtures?live=all",
      {
        headers: {
          "x-apisports-key": apiKey,
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          count: 0,
          fixtures: [],
          error: `Football API svarade med ${response.status}.`,
          apiErrors: data?.errors || null,
        },
        { status: response.status }
      );
    }

    const rawFixtures = Array.isArray(data?.response)
      ? data.response
      : [];

    const fixtures = rawFixtures
      .filter(
        (item: any) =>
          item?.fixture?.id &&
          item?.teams?.home?.id &&
          item?.teams?.away?.id
      )
      .map((item: any) => ({
        fixture: {
          id: item.fixture.id,
          date: item.fixture.date,
          referee: item.fixture.referee || null,
          venue: item.fixture.venue || null,
          status: {
            short: item.fixture.status?.short || "",
            long: item.fixture.status?.long || "",
            elapsed: item.fixture.status?.elapsed ?? null,
          },
        },

        league: {
          id: item.league?.id,
          season: item.league?.season,
          name: item.league?.name || "Okänd liga",
          logo: item.league?.logo,
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

        goals: {
          home: item.goals?.home ?? null,
          away: item.goals?.away ?? null,
        },

        score: item.score || null,
      }));

    return NextResponse.json({
      success: true,
      count: fixtures.length,
      fixtures,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        count: 0,
        fixtures: [],
        error:
          error instanceof Error
            ? error.message
            : "Livematcher kunde inte hämtas.",
      },
      { status: 500 }
    );
  }
}