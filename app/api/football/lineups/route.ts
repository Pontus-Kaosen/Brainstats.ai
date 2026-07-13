import { NextRequest, NextResponse } from "next/server";

import {
  areLineupsConfirmed,
  normalizeTeamLineup,
  orderLineupsForFixture,
} from "@/lib/lineups";

async function fetchFixtureTeams(fixtureId: string) {
  const apiKey = process.env.API_FOOTBALL_KEY;

  if (!apiKey) {
    return { homeTeamId: null, awayTeamId: null };
  }

  try {
    const response = await fetch(
      `https://v3.football.api-sports.io/fixtures?id=${fixtureId}`,
      {
        headers: {
          "x-apisports-key": apiKey,
        },
        cache: "no-store",
      }
    );

    const data = await response.json();
    const fixture = data.response?.[0];

    return {
      homeTeamId: fixture?.teams?.home?.id ?? null,
      awayTeamId: fixture?.teams?.away?.id ?? null,
    };
  } catch {
    return { homeTeamId: null, awayTeamId: null };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fixtureId = searchParams.get("fixture");

    if (!fixtureId) {
      return NextResponse.json(
        {
          success: false,
          error: "Fixture ID saknas.",
          lineups: [],
        },
        { status: 400 }
      );
    }

    if (!process.env.API_FOOTBALL_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "API_FOOTBALL_KEY saknas.",
          lineups: [],
        },
        { status: 500 }
      );
    }

    const [lineupsResponse, fixtureTeams] = await Promise.all([
      fetch(
        `https://v3.football.api-sports.io/fixtures/lineups?fixture=${fixtureId}`,
        {
          headers: {
            "x-apisports-key": process.env.API_FOOTBALL_KEY,
          },
          cache: "no-store",
        }
      ),
      fetchFixtureTeams(fixtureId),
    ]);

    const data = await lineupsResponse.json();

    if (!lineupsResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `API-Football svarade med ${lineupsResponse.status}.`,
          apiErrors: data.errors || null,
          lineups: [],
        },
        { status: lineupsResponse.status }
      );
    }

    const lineups = orderLineupsForFixture(
      (data.response || []).map(normalizeTeamLineup),
      fixtureTeams.homeTeamId,
      fixtureTeams.awayTeamId
    );

    return NextResponse.json({
      success: true,
      fixtureId: Number(fixtureId),
      homeTeamId: fixtureTeams.homeTeamId,
      awayTeamId: fixtureTeams.awayTeamId,
      confirmed: areLineupsConfirmed(lineups),
      lineups,
      errors: data.errors || null,
    });
  } catch (error: unknown) {
    console.error("Lineups route error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Startelvorna kunde inte hämtas.",
        lineups: [],
      },
      { status: 500 }
    );
  }
}
