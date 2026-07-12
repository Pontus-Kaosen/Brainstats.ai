import { NextRequest, NextResponse } from "next/server";

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

    const response = await fetch(
      `https://v3.football.api-sports.io/fixtures/lineups?fixture=${fixtureId}`,
      {
        headers: {
          "x-apisports-key": process.env.API_FOOTBALL_KEY,
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `API-Football svarade med ${response.status}.`,
          apiErrors: data.errors || null,
          lineups: [],
        },
        { status: response.status }
      );
    }

    const lineups = (data.response || []).map((teamLineup: any) => ({
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
    }));

    return NextResponse.json({
      success: true,
      fixtureId: Number(fixtureId),
      confirmed: lineups.length >= 2,
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