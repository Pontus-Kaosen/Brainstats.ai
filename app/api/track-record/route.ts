import { NextResponse } from "next/server";
import {
  computeTrackRecordStats,
  fetchPublicTrackPicks,
  resolvePendingTrackPicks,
} from "@/lib/trackRecordStore";

export async function GET() {
  await resolvePendingTrackPicks(20);
  const rows = await fetchPublicTrackPicks(40);
  const stats = computeTrackRecordStats(rows);

  return NextResponse.json({
    success: true,
    entries: rows,
    stats,
  });
}

export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return NextResponse.json(
      { success: false, error: "CRON_SECRET is not configured." },
      { status: 503 }
    );
  }

  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : req.headers.get("x-cron-secret");

  if (token !== secret) {
    return NextResponse.json(
      { success: false, error: "Unauthorized." },
      { status: 401 }
    );
  }

  const result = await resolvePendingTrackPicks(40);
  const rows = await fetchPublicTrackPicks(40);
  const stats = computeTrackRecordStats(rows);

  return NextResponse.json({
    success: true,
    ...result,
    stats,
  });
}
