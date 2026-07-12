import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const home = searchParams.get("home");
    const away = searchParams.get("away");

    if (!home || !away) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing team ids",
          matches: [],
        },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://v3.football.api-sports.io/fixtures/headtohead?h2h=${home}-${away}&last=5`,
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
      matches: data.response || [],
      errors: data.errors,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || String(error),
        matches: [],
      },
      { status: 500 }
    );
  }
}