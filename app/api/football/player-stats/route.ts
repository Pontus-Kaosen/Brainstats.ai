import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const player = searchParams.get("player");
    const league = searchParams.get("league");
    const season = searchParams.get("season") || "2024";

    if (!player || !league) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing player or league",
          stats: null,
        },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://v3.football.api-sports.io/players?id=${player}&season=${season}&league=${league}`,
      {
        headers: {
          "x-apisports-key": process.env.API_FOOTBALL_KEY!,
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    return NextResponse.json({
      success: true,
      player: data.response?.[0] || null,
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