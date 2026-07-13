import { NextRequest, NextResponse } from "next/server";
import { fetchFootballApi, jsonWithCache } from "@/lib/footballApiFetch";
import {
  CANCELLED_STATUSES,
  mapApiFixtureItem,
  sortFixturesByKickoff,
} from "@/lib/footballFixtures";

export async function GET(request: NextRequest) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        {
          success: false,
          error: "Parametern date måste anges som YYYY-MM-DD.",
          fixtures: [],
        },
        { status: 400 }
      );
    }

    const query = new URLSearchParams({
      date,
      timezone: "Europe/Stockholm",
    });

    const response = await fetchFootballApi(
      `fixtures?${query.toString()}`,
      90,
      { signal: controller.signal }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Football API svarade med ${response.status}.`,
          apiErrors: data?.errors || null,
          fixtures: [],
        },
        { status: response.status }
      );
    }

    if (
      data?.errors &&
      typeof data.errors === "object" &&
      Object.keys(data.errors).length > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Football API returnerade ett fel.",
          apiErrors: data.errors,
          fixtures: [],
        },
        { status: 502 }
      );
    }

    const fixtures = sortFixturesByKickoff(
      (Array.isArray(data.response) ? data.response : [])
        .filter(
          (item: any) =>
            item?.fixture?.id &&
            item?.teams?.home?.id &&
            item?.teams?.away?.id &&
            !CANCELLED_STATUSES.has(item.fixture?.status?.short || "")
        )
        .map(mapApiFixtureItem)
    );

    return jsonWithCache(
      {
        success: true,
        date,
        count: fixtures.length,
        fixtures,
        apiErrors: data?.errors || null,
      },
      90
    );
  } catch (error: unknown) {
    const aborted =
      error instanceof Error && error.name === "AbortError";

    return NextResponse.json(
      {
        success: false,
        error: aborted
          ? "Matchhämtningen tog för lång tid."
          : error instanceof Error
            ? error.message
            : String(error),
        fixtures: [],
      },
      { status: aborted ? 504 : 500 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
