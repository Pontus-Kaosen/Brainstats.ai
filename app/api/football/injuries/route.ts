import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const fixture = searchParams.get("fixture");

    if (!fixture) {
      return NextResponse.json(
        { success: false, error: "Missing fixture parameter", injuries: [] },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://v3.football.api-sports.io/injuries?fixture=${fixture}`,
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
      fixture,
      injuries: data.response || [],
      errors: data.errors || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || String(error),
        injuries: [],
      },
      { status: 500 }
    );
  }
}