import { NextResponse } from "next/server";
import {
  computeValueBetStats,
  fetchPublicValueBetPicks,
  resolvePendingTrackPicks,
} from "@/lib/trackRecordStore";

export async function GET() {
  await resolvePendingTrackPicks(30);
  const entries = await fetchPublicValueBetPicks(10);
  const stats = computeValueBetStats(entries);

  return NextResponse.json({
    success: true,
    entries,
    stats,
  });
}
