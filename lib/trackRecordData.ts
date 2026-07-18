import type { Language } from "@/lib/translations";
import {
  getTrackRecordContent,
  type TrackRecordEntry,
} from "@/lib/trackRecordContent";
import {
  computeTrackRecordStats,
  fetchPublicTrackPicks,
  resolvePendingTrackPicks,
  type TrackRecordStats,
} from "@/lib/trackRecordStore";

export type TrackRecordPageData = ReturnType<typeof getTrackRecordContent> & {
  entries: TrackRecordEntry[];
  stats: TrackRecordStats | null;
  usingLiveData: boolean;
  statsTitle: string;
  statsHitRate: string;
  statsResolved: string;
  statsPending: string;
};

function formatDate(value: string | null, language: Language) {
  if (!value) {
    return language === "en" ? "Unknown" : "Okänt";
  }

  return new Intl.DateTimeFormat(language === "en" ? "en-GB" : "sv-SE", {
    timeZone: "Europe/Stockholm",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function mapRowToEntry(
  row: Awaited<ReturnType<typeof fetchPublicTrackPicks>>[number],
  language: Language
): TrackRecordEntry {
  return {
    date: formatDate(row.published_at, language),
    match: row.match_label,
    market: row.market,
    brainScore: row.brain_score ?? 0,
    safetyTier: (row.safety_tier || 3) as TrackRecordEntry["safetyTier"],
    outcome: row.outcome,
    note:
      row.note ||
      (language === "en"
        ? `Auto-tracked ${row.source_type.replace("_", " ")}`
        : `Automatiskt spårat ${row.source_type === "daily_slip" ? "daglig kupong" : "analys"}`),
  };
}

export async function getTrackRecordPageData(
  language: Language
): Promise<TrackRecordPageData> {
  const base = getTrackRecordContent(language);

  await resolvePendingTrackPicks(15);
  const rows = await fetchPublicTrackPicks(40);

  if (rows.length === 0) {
    return {
      ...base,
      entries: base.entries,
      stats: null,
      usingLiveData: false,
      statsTitle:
        language === "en" ? "Live track record" : "Live track record",
      statsHitRate: language === "en" ? "Hit rate" : "Träffsäkerhet",
      statsResolved:
        language === "en" ? "Resolved picks" : "Avgjorda tips",
      statsPending: language === "en" ? "Pending" : "Väntar",
    };
  }

  const stats = computeTrackRecordStats(rows);

  return {
    ...base,
    entries: rows.map((row) => mapRowToEntry(row, language)),
    stats,
    usingLiveData: true,
    description:
      language === "en"
        ? "Live outcomes from BrainStats public picks — updated automatically after full time."
        : "Live-resultat från BrainStats publicerade tips — uppdateras automatiskt efter slutsignal.",
    disclaimer:
      language === "en"
        ? "BrainStats is an analysis tool, not a bookmaker. Past outcomes are not a guarantee of future results."
        : "BrainStats är ett analysverktyg, inte spelbolag. Tidigare utfall är ingen garanti för framtida resultat.",
    emptyNote:
      language === "en"
        ? "New public picks are added when daily slips and featured analyses are created."
        : "Nya publika tips läggs till när dagliga kuponger och analyser skapas.",
    statsTitle:
      language === "en" ? "Live track record" : "Live track record",
    statsHitRate: language === "en" ? "Hit rate" : "Träffsäkerhet",
    statsResolved: language === "en" ? "Resolved picks" : "Avgjorda tips",
    statsPending: language === "en" ? "Pending" : "Väntar",
  };
}
