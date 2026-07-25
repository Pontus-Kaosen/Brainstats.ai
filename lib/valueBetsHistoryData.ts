import {
  computeValueBetStats,
  fetchPublicValueBetPicks,
  resolvePendingTrackPicks,
  type PublicTrackPickRow,
} from "@/lib/trackRecordStore";

export type ValueBetsHistoryData = {
  entries: PublicTrackPickRow[];
  stats: ReturnType<typeof computeValueBetStats>;
};

export async function getValueBetsHistoryData(
  limit = 8
): Promise<ValueBetsHistoryData> {
  await resolvePendingTrackPicks(40);
  const entries = await fetchPublicValueBetPicks(limit);
  const stats = computeValueBetStats(await fetchPublicValueBetPicks(60));

  return { entries, stats };
}
