import { NextRequest, NextResponse } from "next/server";
import { fetchFootballApi, jsonWithCache } from "@/lib/footballApiFetch";

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

    const response = await fetchFootballApi(
      `fixtures/headtohead?h2h=${home}-${away}&last=5`,
      600
    );

    const data = await response.json();

    return jsonWithCache(
      {
        success: true,
        matches: data.response || [],
        errors: data.errors,
      },
      600
    );
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