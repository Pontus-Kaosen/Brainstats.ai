import { NextRequest, NextResponse } from "next/server";
import { fetchFootballApi, jsonWithCache } from "@/lib/footballApiFetch";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const league = searchParams.get("league") || "39";
    const season = searchParams.get("season") || "2024";

    const response = await fetchFootballApi(
      `standings?league=${league}&season=${season}`,
      900
    );

    const data = await response.json();

    const standings =
      data.response?.[0]?.league?.standings?.[0]?.map((team: any) => ({
        rank: team.rank,
        teamId: team.team.id,
        teamName: team.team.name,
        logo: team.team.logo,
        points: team.points,
        goalsDiff: team.goalsDiff,
        played: team.all.played,
        won: team.all.win,
        draw: team.all.draw,
        lost: team.all.lose,
      })) || [];

    return jsonWithCache(
      {
        success: true,
        league,
        season,
        standings,
        errors: data.errors,
      },
      900
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || String(error),
        standings: [],
      },
      { status: 500 }
    );
  }
}