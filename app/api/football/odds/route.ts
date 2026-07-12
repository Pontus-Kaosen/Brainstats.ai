import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const fixture = searchParams.get("fixture");

  if (!fixture) {
    return NextResponse.json({
      success: false,
      error: "Fixture saknas",
    });
  }

  const response = await fetch(
    `https://v3.football.api-sports.io/odds?fixture=${fixture}`,
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
    odds: data.response || [],
    errors: data.errors || null,
  });
}