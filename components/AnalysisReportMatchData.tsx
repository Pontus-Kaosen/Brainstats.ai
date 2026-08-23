"use client";

import { useMemo } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { formatTranslation, translateBreakdownKey } from "@/lib/locale";
import {
  analysisReportCardClass,
  analysisReportCardClassCompact,
  analysisReportTitleGradient,
  injuryReason,
  matchText,
} from "@/lib/analysisReportHelpers";
import type {
  AnalysisUsedData,
  LastMatch,
  ScoreBreakdown,
} from "@/lib/analysisReportTypes";
import {
  formResultForTeam,
  readH2H,
  readInjuries,
  readLastMatches,
  readLineupStarters,
  readRotationRisks,
  readScheduleContext,
  readWeather,
  seasonLine,
  standingLine,
} from "@/lib/analysisReportView";
import { summarizeRotationRisksForUi } from "@/lib/matchImportance";
import { hasPartialLineups } from "@/lib/lineups";

type AnalysisReportMatchDataProps = {
  usedData: AnalysisUsedData;
  breakdown?: ScoreBreakdown;
  betText?: string | null;
  selectedPlayerId?: number | null;
  compact?: boolean;
};

export default function AnalysisReportMatchData({
  usedData,
  breakdown = {},
  betText,
  selectedPlayerId = null,
  compact = false,
}: AnalysisReportMatchDataProps) {
  const { t, language } = useLanguage();
  const cardClass = compact
    ? analysisReportCardClassCompact
    : analysisReportCardClass;
  const titleGradient = analysisReportTitleGradient;
  const sectionGap = compact ? "space-y-4" : "space-y-8";
  const blockGap = compact ? "mt-4" : "mt-6";
  const sectionTitle = compact ? "text-xl font-bold" : "text-2xl font-bold";
  const gridGap = compact ? "gap-4" : "gap-6";

  const homeLastMatches = readLastMatches(usedData, "home");
  const awayLastMatches = readLastMatches(usedData, "away");
  const injuries = readInjuries(usedData);
  const lineups = usedData.lineups || [];
  const homeLineup = lineups[0];
  const awayLineup = lineups[1];
  const confirmedLineups = usedData.confirmedLineups === true;
  const partialLineups = hasPartialLineups(lineups);
  const playerLineupStatus = usedData.playerLineupStatus ?? null;
  const weather = readWeather(usedData.weather);
  const referee = usedData.referee;
  const rotationSummaries = summarizeRotationRisksForUi(
    readRotationRisks(usedData),
    language
  );
  const h2hMatches = readH2H(usedData);
  const scheduleContext = readScheduleContext(usedData);
  const scheduleTeams = usedData.scheduleTeamsChecked || [];
  const scheduleStatusMessage =
    scheduleContext === "checked_clear"
      ? formatTranslation(t.analyze.scheduleCheckedClear, {
          teams: scheduleTeams.join(", "),
        })
      : scheduleContext === "no_team"
        ? t.analyze.scheduleNoTeam
        : scheduleContext === "no_fixture"
          ? t.analyze.scheduleNoFixture
          : "";

  const resolvedPlayerId = useMemo(() => {
    if (selectedPlayerId) return selectedPlayerId;
    const match = betText?.match(/Player ID:\s*(\d+)/i);
    return match ? Number(match[1]) : null;
  }, [betText, selectedPlayerId]);

  const homeTeamId = usedData.homeTeamId;
  const awayTeamId = usedData.awayTeamId;
  const breakdownEntries = Object.entries(breakdown).filter(
    ([, value]) => value != null
  );

  function renderFormList(matches: LastMatch[], teamId?: string | null) {
    if (matches.length === 0) {
      return (
        <p className="text-sm text-[#A9A9A9]">{t.analyze.noMatchData}</p>
      );
    }

    return matches.map((match) => (
      <div
        key={match.fixture.id}
        className={`rounded-lg bg-[#101010]/80 text-sm text-[#D8D8D8] ${compact ? "p-2" : "rounded-xl p-3"}`}
      >
        <span className="mr-1.5">{formResultForTeam(match, teamId)}</span>
        {matchText(match)}
      </div>
    ));
  }

  return (
    <div className={sectionGap}>
      {rotationSummaries.length > 0 || scheduleStatusMessage ? (
        <div
          className={`rounded-2xl border ${compact ? "p-4" : "rounded-3xl p-6 sm:p-8"} ${
            rotationSummaries.length > 0
              ? "border-yellow-500/30 bg-yellow-500/10"
              : "border-white/10 bg-black/30"
          }`}
        >
          <p
            className={`text-xs uppercase tracking-[0.25em] ${titleGradient} sm:text-sm`}
          >
            {t.analyze.scheduleContextTitle}
          </p>
          <p className="mt-1.5 text-xs text-[#A9A9A9] sm:text-sm">
            {t.analyze.scheduleContextHint}
          </p>
          {rotationSummaries.length > 0 ? (
            <ul className={compact ? "mt-3 space-y-2" : "mt-4 space-y-3"}>
              {rotationSummaries.map((item) => (
                <li
                  key={item}
                  className="rounded-xl border border-yellow-500/20 bg-black/30 px-3 py-2 text-sm leading-6 text-[#E8E8E8]"
                >
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm leading-6 text-[#A9A9A9]">
              {scheduleStatusMessage}
            </p>
          )}
        </div>
      ) : null}

      <div className={`grid ${gridGap} md:grid-cols-2`}>
        <div className={cardClass}>
          <p
            className={`text-xs uppercase tracking-[0.25em] ${titleGradient} sm:text-sm`}
          >
            {t.analyze.scoreBreakdownBadge}
          </p>
          <h3 className={`mt-1.5 ${sectionTitle} text-white`}>
            {t.analyze.scoreBreakdownTitle}
          </h3>
          <div className={`${blockGap} ${compact ? "space-y-3" : "space-y-5"}`}>
            {breakdownEntries.length === 0 ? (
              <p className="text-sm text-[#A9A9A9]">{t.analyze.noMatchData}</p>
            ) : (
              breakdownEntries.map(([key, value]) => (
                <div key={key}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="capitalize text-[#A9A9A9]">
                      {translateBreakdownKey(key, t)}
                    </span>
                    <span className="font-semibold text-[#18ff6d]">
                      +{value}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-black/50">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#18ff6d] to-[#2fbfff] transition-all duration-700"
                      style={{
                        width: `${Math.min(Number(value) * 5, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={cardClass}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p
                className={`text-xs uppercase tracking-[0.25em] ${titleGradient} sm:text-sm`}
              >
                {t.analyze.startingXiBadge}
              </p>
              <h3 className={`mt-1.5 ${sectionTitle} text-white`}>
                {t.analyze.startingXi}
              </h3>
            </div>
            <span
              className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                confirmedLineups
                  ? "border-[#18ff6d44] bg-[#18ff6d]/10 text-[#18ff6d]"
                  : "border-yellow-500/40 bg-yellow-500/10 text-yellow-300"
              }`}
            >
              {confirmedLineups ? t.analyze.confirmed : t.analyze.awaiting}
            </span>
          </div>

          {!confirmedLineups && !partialLineups ? (
            <div
              className={`${blockGap} rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4`}
            >
              <p className="text-sm font-semibold text-yellow-200">
                {t.analyze.lineupsNotPublished}
              </p>
              <p className="mt-1.5 text-sm leading-6 text-[#A9A9A9]">
                {t.analyze.lineupsHint}
              </p>
            </div>
          ) : (
            <div
              className={`${blockGap} ${compact ? "grid gap-4 xl:grid-cols-2" : "space-y-6"}`}
            >
              {playerLineupStatus === "bench" ? (
                <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-100 xl:col-span-2">
                  {t.analyze.playerOnBenchWarningReport}
                </div>
              ) : null}
              {playerLineupStatus === "not_in_squad" ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100 xl:col-span-2">
                  {t.analyze.playerNotStartingWarningReport}
                </div>
              ) : null}
              {[homeLineup, awayLineup]
                .filter((lineup) => readLineupStarters(lineup).length > 0)
                .map((lineup, teamIndex) => (
                  <div
                    key={lineup?.team?.id || teamIndex}
                    className="overflow-hidden rounded-xl border border-[#18ff6d22] brain-inset"
                  >
                    <div
                      className={`flex items-center gap-3 border-b border-white/10 ${compact ? "p-3" : "p-5"}`}
                    >
                      {lineup?.team?.logo ? (
                        <img
                          src={lineup.team.logo}
                          alt={lineup.team.name || t.common.teamAlt}
                          className={`rounded-full bg-white p-1 ${compact ? "h-9 w-9" : "h-12 w-12"}`}
                        />
                      ) : null}
                      <div>
                        <p
                          className={`font-black text-white ${compact ? "text-base" : "text-lg"}`}
                        >
                          {lineup?.team?.name ||
                            (teamIndex === 0
                              ? t.analyze.homeTeam
                              : t.analyze.awayTeam)}
                        </p>
                        <p className="mt-0.5 text-xs text-[#18ff6d] sm:text-sm">
                          {t.analyze.formation}{" "}
                          {lineup?.formation || t.analyze.notSpecified}
                        </p>
                        {lineup?.coach?.name ? (
                          <p className="mt-0.5 text-xs text-[#A9A9A9]">
                            {t.analyze.coach} {lineup.coach.name}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className={compact ? "p-3" : "p-5"}>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#777]">
                        {t.analyze.startingPlayers}
                      </p>
                      <div
                        className={
                          compact ? "mt-2 space-y-1.5" : "mt-4 space-y-2"
                        }
                      >
                        {readLineupStarters(lineup).map((player, playerIndex) => (
                          <div
                            key={player.id || `${player.name}-${playerIndex}`}
                            className={`flex items-center justify-between rounded-lg border px-3 ${compact ? "py-2" : "rounded-xl px-4 py-3"} ${
                              resolvedPlayerId &&
                              player.id === resolvedPlayerId
                                ? "border-[#18ff6d] bg-[#18ff6d]/10"
                                : "border-white/5 bg-[#101010]/80"
                            }`}
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#18ff6d]/10 text-sm font-black text-[#18ff6d]">
                                {player.number ?? "–"}
                              </span>
                              <span className="truncate font-semibold text-[#E8E8E8]">
                                {player.name || t.analyze.unknownPlayer}
                              </span>
                              {resolvedPlayerId &&
                              player.id === resolvedPlayerId ? (
                                <span className="rounded-full bg-[#18ff6d]/20 px-2 py-0.5 text-[10px] font-bold text-[#18ff6d]">
                                  {t.analyze.selectedPlayerBadge}
                                </span>
                              ) : null}
                            </div>
                            <span className="ml-3 shrink-0 text-xs font-bold text-[#A9A9A9]">
                              {player.position || "–"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className={cardClass}>
        <p
          className={`text-xs uppercase tracking-[0.25em] ${titleGradient} sm:text-sm`}
        >
          {t.analyze.matchConditions}
        </p>
        <div
          className={`${blockGap} grid gap-4 ${compact ? "lg:grid-cols-[1.4fr_1fr]" : "md:grid-cols-2"}`}
        >
          <div>
            <h3 className={`${sectionTitle} text-white`}>
              {t.analyze.weather}
            </h3>
            {weather ? (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  [t.analyze.temperature, `${weather.temperature ?? "–"}°C`],
                  [t.analyze.weatherDesc, weather.description ?? "–"],
                  [t.analyze.wind, `${weather.wind ?? "–"} km/h`],
                  [t.analyze.humidity, `${weather.humidity ?? "–"}%`],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-[#18ff6d11] brain-inset p-3"
                  >
                    <p className="text-[10px] text-[#A9A9A9] sm:text-xs">
                      {label}
                    </p>
                    <p className="mt-1 text-sm font-bold text-[#18ff6d] sm:text-base">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-[#A9A9A9]">
                {t.analyze.noWeatherData}
              </p>
            )}
          </div>
          <div className="rounded-xl border border-[#18ff6d11] brain-inset p-4">
            <p className="text-xs text-[#A9A9A9]">{t.analyze.matchOfficial}</p>
            <p
              className={`mt-2 text-lg font-bold sm:text-xl ${referee ? "text-[#18ff6d]" : "text-[#A9A9A9]"}`}
            >
              {referee || t.analyze.noRefereeData}
            </p>
          </div>
        </div>
      </div>

      <div className={`grid ${gridGap} md:grid-cols-2`}>
        <div className={cardClass}>
          <p
            className={`text-xs uppercase tracking-[0.25em] ${titleGradient} sm:text-sm`}
          >
            {t.scoreBreakdown.table}
          </p>
          <h3 className={`mt-1.5 ${sectionTitle} text-white`}>
            {t.scoreBreakdown.table}
          </h3>
          <div className={`${blockGap} space-y-3`}>
            {[
              [t.analyze.homeTeam, usedData.homeStanding, usedData.homeSeason],
              [t.analyze.awayTeam, usedData.awayStanding, usedData.awaySeason],
            ].map(([label, standing, season]) => (
              <div
                key={String(label)}
                className="rounded-xl border border-[#18ff6d11] brain-inset p-4"
              >
                <p className="text-sm font-bold text-[#18ff6d]">
                  {label as string}
                </p>
                <p className="mt-1 text-sm text-[#E8E8E8]">
                  {standingLine(standing as never) || t.standings.noTableData}
                </p>
                {seasonLine(season as never) ? (
                  <p className="mt-1 text-xs text-[#A9A9A9]">
                    {seasonLine(season as never)}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className={cardClass}>
          <p
            className={`text-xs uppercase tracking-[0.25em] ${titleGradient} sm:text-sm`}
          >
            {t.scoreBreakdown.h2h}
          </p>
          <h3 className={`mt-1.5 ${sectionTitle} text-white`}>
            {t.scoreBreakdown.h2h}
          </h3>
          <div className={`${blockGap} space-y-2`}>
            {h2hMatches.length === 0 ? (
              <p className="text-sm text-[#A9A9A9]">{t.analyze.noMatchData}</p>
            ) : (
              h2hMatches.map((match) => (
                <div
                  key={match.fixture.id}
                  className={`rounded-lg bg-[#101010]/80 text-sm text-[#D8D8D8] ${compact ? "p-2" : "rounded-xl p-3"}`}
                >
                  {matchText(match)}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className={`grid ${gridGap} ${compact ? "xl:grid-cols-2" : ""}`}>
        <div className={cardClass}>
          <p
            className={`text-xs uppercase tracking-[0.25em] ${titleGradient} sm:text-sm`}
          >
            {t.analyze.teamFormBadge}
          </p>
          <h3 className={`mt-1.5 ${sectionTitle} text-white`}>
            {t.analyze.lastFiveMatches}
          </h3>
          <div className={`${blockGap} grid gap-4 md:grid-cols-2`}>
            <div className="rounded-xl border border-[#18ff6d11] brain-inset p-4">
              <h4 className="text-sm font-bold text-[#18ff6d]">
                {t.analyze.homeTeam}
              </h4>
              <div className={compact ? "mt-2 space-y-1.5" : "mt-4 space-y-3"}>
                {renderFormList(homeLastMatches, homeTeamId)}
              </div>
            </div>
            <div className="rounded-xl border border-[#18ff6d11] brain-inset p-4">
              <h4 className="text-sm font-bold text-[#18ff6d]">
                {t.analyze.awayTeam}
              </h4>
              <div className={compact ? "mt-2 space-y-1.5" : "mt-4 space-y-3"}>
                {renderFormList(awayLastMatches, awayTeamId)}
              </div>
            </div>
          </div>
        </div>

        <div className={cardClass}>
          <p
            className={`text-xs uppercase tracking-[0.25em] ${titleGradient} sm:text-sm`}
          >
            {t.analyze.injuriesBadge}
          </p>
          <h3 className={`mt-1.5 ${sectionTitle} text-white`}>
            {t.analyze.injuries}
          </h3>
          <div className={`${blockGap} ${compact ? "space-y-2" : "space-y-3"}`}>
            {injuries.length === 0 ? (
              <p className="text-sm text-[#A9A9A9]">{t.analyze.noInjuries}</p>
            ) : (
              injuries.map((injury, index) => (
                <div
                  key={`${injury.player?.name}-${index}`}
                  className={`flex items-center gap-3 rounded-xl brain-inset text-sm ${compact ? "p-3" : "gap-4 rounded-2xl p-4"}`}
                >
                  {injury.team?.logo ? (
                    <img
                      src={injury.team.logo}
                      alt={injury.team.name || t.common.teamAlt}
                      className={`rounded-full bg-white p-1 ${compact ? "h-8 w-8" : "h-9 w-9"}`}
                    />
                  ) : null}
                  <div>
                    <p className="font-semibold text-[#18ff6d]">
                      {injury.player?.name || t.analyze.unknownPlayer}
                    </p>
                    <p className="mt-0.5 text-[#D8D8D8]">
                      {injury.team?.name || t.analyze.unknownTeam}
                    </p>
                    <p className="mt-0.5 text-xs text-[#A9A9A9]">
                      {injuryReason(injury, t.analyze.noInjuryReason)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {betText ? (
        <div className={cardClass}>
          <h3 className={`${sectionTitle} text-white`}>
            {t.analyze.yourBetIdea}
          </h3>
          <pre
            className={`whitespace-pre-wrap rounded-xl bg-black/40 text-sm text-[#D8D8D8] ${compact ? "mt-3 p-3" : "mt-5 rounded-2xl p-5"}`}
          >
            {betText}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
