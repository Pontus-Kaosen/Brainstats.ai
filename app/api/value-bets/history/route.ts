import { NextResponse } from "next/server";
import {
  computeValueBetStats,
  fetchPublicValueBetPicks,
  resolvePendingTrackPicks,
} from "@/lib/trackRecordStore";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(
    8,
    Math.max(1, Number(searchParams.get("limit") || 8))
  );

  await resolvePendingTrackPicks(50);
  const entries = await fetchPublicValueBetPicks(limit);
  const stats = computeValueBetStats(await fetchPublicValueBetPicks(60));

  return NextResponse.json(
    {
      success: true,
      entries,
      stats,
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
