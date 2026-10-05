"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { formatTranslation } from "@/lib/locale";
import type {
  AnalysisUsedData,
  LastMatch,
  MatchPlayerHighlight,
} from "@/lib/analysisReportTypes";
import { readLastMatches } from "@/lib/analysisReportView";

type MatchPulseProps = {
  usedData: AnalysisUsedData;
};

type FinishedRow = {
  isHome: boolean;
  scored: number;
  conceded: number;
  date: string;
  result: "W" | "D" | "L";
};

function finishedRows(matches: LastMatch[], teamId?: string | null): FinishedRow[] {
  return matches
    .map((match) => {
      const homeGoals = match.goals?.home;
      const awayGoals = match.goals?.away;

      if (homeGoals == null || awayGoals == null || teamId == null) {
        return null;
      }

      const isHome = String(match.teams.home.id ?? "") === String(teamId);
      const scored = isHome ? homeGoals : awayGoals;
      const conceded = isHome ? awayGoals : homeGoals;
      const result: FinishedRow["result"] =
        scored === conceded ? "D" : scored > conceded ? "W" : "L";

      return {
        isHome,
        scored,
        conceded,
        date: String(match.fixture.date || "").slice(0, 10),
        result,
      };
    })
    .filter((row): row is FinishedRow => row !== null);
}

function recordLabel(rows: FinishedRow[]) {
  let wins = 0;
  let draws = 0;
  let losses = 0;

  for (const row of rows) {
    if (row.result === "W") wins += 1;
    else if (row.result === "D") draws += 1;
    else losses += 1;
  }

  return rows.length === 0 ? "–" : `${wins}-${draws}-${losses}`;
}

function rateLabel(count: number, total: number) {
  return total === 0 ? "–" : `${count}/${total}`;
}

function restDays(rows: FinishedRow[], fixtureDate?: string | null) {
  if (!fixtureDate) return null;

  const kickoff = new Date(fixtureDate).getTime();
  const latest = rows
    .map((row) => new Date(row.date).getTime())
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => b - a)[0];

  if (!Number.isFinite(kickoff) || latest == null) return null;

  const days = Math.round((kickoff - latest) / 86_400_000);

  if (days < 0 || days > 21) return null;

  return days;
}

function beadClass(result: FinishedRow["result"]) {
  if (result === "W") return "bg-[#18ff6d] text-black";
  if (result === "L") return "bg-red-500/90 text-white";
  return "bg-[#E8DCC8] text-black";
}

function highlightLine(
  players: MatchPlayerHighlight[] | undefined,
  goalLabel: string,
  assistLabel: string
) {
  if (!players?.length) return null;

  return players
    .map((player) => {
      const bits = [player.rating ? player.rating : null];

      if (player.goals) bits.push(`${player.goals} ${goalLabel}`);
      if (player.assists) bits.push(`${player.assists} ${assistLabel}`);

      const detail = bits.filter(Boolean).join(" · ");

      return detail ? `${player.name} ${detail}` : player.name;
    })
    .join("  ·  ");
}

export default function MatchPulse({ usedData }: MatchPulseProps) {
  const { t, language } = useLanguage();
  const goalLabel = language === "en" ? "goals" : "mål";
  const assistLabel = language === "en" ? "assists" : "ass";
  const homeRows = finishedRows(readLastMatches(usedData, "home"), usedData.homeTeamId);
  const awayRows = finishedRows(readLastMatches(usedData, "away"), usedData.awayTeamId);

  if (
    homeRows.length === 0 &&
    awayRows.length === 0 &&
    !usedData.homeCoach?.name &&
    !usedData.awayCoach?.name
  ) {
    return null;
  }

  const homeName = usedData.homeStanding?.teamName || t.analyze.homeTeam;
  const awayName = usedData.awayStanding?.teamName || t.analyze.awayTeam;
  const homeRest = restDays(homeRows, usedData.fixtureDate);
  const awayRest = restDays(awayRows, usedData.fixtureDate);
  const homeRatings = highlightLine(usedData.homeMatchHighlights, goalLabel, assistLabel);
  const awayRatings = highlightLine(usedData.awayMatchHighlights, goalLabel, assistLabel);

  const sides = [
    {
      name: homeName,
      rows: homeRows,
      venue: recordLabel(homeRows.filter((row) => row.isHome)),
      venueLabel: t.analyze.pulseVenueHome,
      rest: homeRest,
      coach: usedData.homeCoach?.name,
      ratings: homeRatings,
    },
    {
      name: awayName,
      rows: awayRows,
      venue: recordLabel(awayRows.filter((row) => !row.isHome)),
      venueLabel: t.analyze.pulseVenueAway,
      rest: awayRest,
      coach: usedData.awayCoach?.name,
      ratings: awayRatings,
    },
  ];

  return (
    <section className="brain-card overflow-hidden rounded-2xl p-5">
      <p className="bg-gradient-to-r from-[#18ff6d] via-[#E8DCC8] to-[#2fbfff] bg-clip-text text-xs uppercase tracking-[0.28em] text-transparent">
        {t.analyze.pulseBadge}
      </p>
      <h3 className="mt-1 text-xl font-black text-white">{t.analyze.pulseTitle}</h3>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {sides.map((side) => (
          <div
            key={side.name}
            className="rounded-xl border border-[#18ff6d22] bg-black/30 p-3"
          >
            <p className="text-sm font-bold text-white">{side.name}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {side.rows.slice(0, 5).map((row, index) => (
                <span
                  key={`${side.name}-${row.date}-${index}`}
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${beadClass(row.result)}`}
                >
                  {row.result}
                </span>
              ))}
            </div>
            <p className="mt-2 text-xs text-[#A9A9A9]">
              {side.venueLabel} {side.venue}
              {side.rest != null
                ? ` · ${t.analyze.pulseRest} ${formatTranslation(t.analyze.pulseRestDays, { days: side.rest })}`
                : ""}
            </p>
            {side.coach ? (
              <p className="mt-1 text-xs text-[#D8D8D8]">
                {t.analyze.pulseCoach}: {side.coach}
              </p>
            ) : null}
            {side.ratings ? (
              <p className="mt-1 text-xs leading-5 text-[#D8D8D8]">
                {t.analyze.pulseRatings}: {side.ratings}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {[
          [
            t.analyze.pulseBoth,
            `${t.analyze.homeTeam} ${rateLabel(homeRows.filter((row) => row.scored > 0 && row.conceded > 0).length, homeRows.length)} · ${t.analyze.awayTeam} ${rateLabel(awayRows.filter((row) => row.scored > 0 && row.conceded > 0).length, awayRows.length)}`,
          ],
          [
            t.analyze.pulseOver,
            `${t.analyze.homeTeam} ${rateLabel(homeRows.filter((row) => row.scored + row.conceded >= 3).length, homeRows.length)} · ${t.analyze.awayTeam} ${rateLabel(awayRows.filter((row) => row.scored + row.conceded >= 3).length, awayRows.length)}`,
          ],
        ].map(([label, value]) => (
          <div key={label} className="brain-stat-tile rounded-xl px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wide text-[#888]">{label}</p>
            <p className="mt-1 text-sm font-bold text-[#18ff6d]">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
