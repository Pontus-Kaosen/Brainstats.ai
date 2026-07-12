import { NextRequest, NextResponse } from "next/server";
import { fetchFootballApi, jsonWithCache } from "@/lib/footballApiFetch";

function getResult(match: any, teamId: number) {
  const homeId = match.teams.home.id;
  const awayId = match.teams.away.id;

  const homeGoals = match.goals.home;
  const awayGoals = match.goals.away;

  if (homeGoals === awayGoals) return "D";

  const teamIsHome = homeId === teamId;
  const teamGoals = teamIsHome ? homeGoals : awayGoals;
  const opponentGoals = teamIsHome ? awayGoals : homeGoals;

  return teamGoals > opponentGoals ? "W" : "L";
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const teamId = Number(searchParams.get("team"));
    const season = searchParams.get("season") || "2024";

    if (!teamId) {
      return NextResponse.json(
        { success: false, error: "Missing team parameter", form: [] },
        { status: 400 }
      );
    }

    const response = await fetchFootballApi(
      `fixtures?team=${teamId}&season=${season}`,
      600
    );

    const data = await response.json();

    const matches = (data.response || [])
  .filter(
    (match: any) =>
      match.fixture.status.short === "FT" ||
      match.fixture.status.short === "AET" ||
      match.fixture.status.short === "PEN"
  )
  .sort(
    (a: any, b: any) =>
      new Date(b.fixture.date).getTime() -
      new Date(a.fixture.date).getTime()
  )
  .slice(0, 5);

const form = matches.map((match: any) => ({
  fixtureId: match.fixture.id,
  date: match.fixture.date,
  opponent:
    match.teams.home.id === teamId
      ? match.teams.away.name
      : match.teams.home.name,
  result: getResult(match, teamId),
  score: `${match.goals.home}-${match.goals.away}`,
}));
    

    return jsonWithCache(
      {
        success: true,
        teamId,
        form,
        errors: data.errors,
      },
      600
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || String(error),
        form: [],
      },
      { status: 500 }
    );
  }
}