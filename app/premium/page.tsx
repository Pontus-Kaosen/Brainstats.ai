import PremiumPageClient from "@/components/PremiumPageClient";
import { getValueBetsHistoryData } from "@/lib/valueBetsHistoryData";
import {
  computeTrackRecordStats,
  fetchPublicTrackPicks,
  resolvePendingTrackPicks,
} from "@/lib/trackRecordStore";

export default async function PremiumPage() {
  const [valueBetsHistory, trackPicks] = await Promise.all([
    getValueBetsHistoryData(6),
    (async () => {
      await resolvePendingTrackPicks(40);
      return fetchPublicTrackPicks(60);
    })(),
  ]);

  const trackStats = computeTrackRecordStats(trackPicks);

  return (
    <PremiumPageClient
      trustData={{
        valueBetStats: valueBetsHistory.stats,
        valueBetEntries: valueBetsHistory.entries.map((entry) => ({
          id: entry.id,
          match_label: entry.match_label,
          market: entry.market,
          outcome: entry.outcome,
        })),
        analysisHitRate: trackStats.hitRate,
        analysisResolved: trackStats.resolved,
      }}
    />
  );
}
