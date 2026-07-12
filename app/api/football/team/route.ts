import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const teamId = searchParams.get("team");
    const leagueId = searchParams.get("league") || "39";
    const season = searchParams.get("season") || "2024";

    if (!teamId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing team parameter",
        },
        { status: 400 }
      );
    }

    const [statsResponse, fixturesResponse] = await Promise.all([
      fetch(
        `https://v3.football.api-sports.io/teams/statistics?league=${leagueId}&season=${season}&team=${teamId}`,
        {
          headers: {
            "x-apisports-key": process.env.API_FOOTBALL_KEY!,
          },
          cache: "no-store",
        }
      ),
      fetch(
        `https://v3.football.api-sports.io/fixtures?league=${leagueId}&season=${season}&team=${teamId}&last=5`,
        {
          headers: {
            "x-apisports-key": process.env.API_FOOTBALL_KEY!,
          },
          cache: "no-store",
        }
      ),
    ]);

    const statsData = await statsResponse.json();
    const fixturesData = await fixturesResponse.json();

    return NextResponse.json({
      success: true,
      statistics: statsData.response,
      lastFive: fixturesData.response || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}