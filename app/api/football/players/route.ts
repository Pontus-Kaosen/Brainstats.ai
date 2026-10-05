import { NextRequest, NextResponse } from "next/server";
import { fetchFootballApi, jsonWithCache } from "@/lib/footballApiFetch";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const team = searchParams.get("team");
    const season = searchParams.get("season") || "2024";

    if (!team) {
      return NextResponse.json(
        { success: false, error: "Missing team parameter", players: [] },
        { status: 400 }
      );
    }

    const response = await fetchFootballApi(
      `players/squads?team=${team}`,
      1800
    );

    const data = await response.json();

    const players =
      data.response?.[0]?.players?.map((item: any) => ({
        id: item.id,
        name: item.name,
        age: item.age,
        number: item.number,
        position: item.position,
        photo: item.photo,
      })) || [];

    return jsonWithCache(
      {
        success: true,
        team,
        season,
        players,
        errors: data.errors || null,
      },
      1800
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || String(error),
        players: [],
      },
      { status: 500 }
    );
  }
}