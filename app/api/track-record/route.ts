import { NextResponse } from "next/server";
import {
  computeTrackRecordStats,
  fetchPublicTrackPicks,
  resolvePendingTrackPicks,
} from "@/lib/trackRecordStore";

function readCronToken(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return request.headers.get("x-cron-secret");
}

function isAuthorizedCron(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return false;
  }

  return readCronToken(request) === secret;
}

export async function GET(request: Request) {
  const cron = isAuthorizedCron(request);
  const resolveLimit = cron ? 50 : 20;
  const result = await resolvePendingTrackPicks(resolveLimit);

  if (cron) {
    return NextResponse.json({
      success: true,
      cron: true,
      ...result,
    });
  }

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

  const token = readCronToken(req);

  if (token !== secret) {
    return NextResponse.json(
      { success: false, error: "Unauthorized." },
      { status: 401 }
    );
  }

  const result = await resolvePendingTrackPicks(50);
  const rows = await fetchPublicTrackPicks(40);
  const stats = computeTrackRecordStats(rows);

  return NextResponse.json({
    success: true,
    ...result,
    stats,
  });
}
