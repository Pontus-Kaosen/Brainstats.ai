"use client";

import { useMemo } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { formatTranslation, translateBreakdownKey } from "@/lib/locale";
import {
  analysisReportCardClass,
  analysisReportTitleGradient,
  injuryReason,
  matchText,
  resultIcon,
} from "@/lib/analysisReportHelpers";
import type {
  AnalysisUsedData,
  LastMatch,
  ScoreBreakdown,
} from "@/lib/analysisReportTypes";
import { summarizeRotationRisksForUi } from "@/lib/matchImportance";
import { hasPartialLineups } from "@/lib/lineups";

type AnalysisReportMatchDataProps = {
  usedData: AnalysisUsedData;
  breakdown?: ScoreBreakdown;
  betText?: string | null;
  selectedPlayerId?: number | null;
};

export default function AnalysisReportMatchData({
  usedData,
  breakdown = {},
  betText,
  selectedPlayerId = null,
}: AnalysisReportMatchDataProps) {
  const { t, language } = useLanguage();
  const cardClass = analysisReportCardClass;
  const titleGradient = analysisReportTitleGradient;

  const homeLastMatches = usedData.lastMatches?.home || [];
  const awayLastMatches = usedData.lastMatches?.away || [];
  const injuries = usedData.injuries || [];
  const lineups = usedData.lineups || [];
  const homeLineup = lineups[0];
  const awayLineup = lineups[1];
  const confirmedLineups = usedData.confirmedLineups === true;
  const partialLineups = hasPartialLineups(lineups);
  const playerLineupStatus = usedData.playerLineupStatus ?? null;
  const weather = usedData.weather;
  const referee = usedData.referee;
  const rotationSummaries = summarizeRotationRisksForUi(
    usedData.rotationRisks || [],
    language
  );
  const scheduleStatusMessage =
    usedData.scheduleContext === "checked_clear"
      ? formatTranslation(t.analyze.scheduleCheckedClear, {
          teams: (usedData.scheduleTeamsChecked || []).join(", "),
        })
      : usedData.scheduleContext === "no_team"
        ? t.analyze.scheduleNoTeam
        : usedData.scheduleContext === "no_fixture"
          ? t.analyze.scheduleNoFixture
          : "";

  const resolvedPlayerId = useMemo(() => {
    if (selectedPlayerId) return selectedPlayerId;
    const match = betText?.match(/Player ID:\s*(\d+)/i);
    return match ? Number(match[1]) : null;
  }, [betText, selectedPlayerId]);

  return (
    <div className="space-y-8">
      {(rotationSummaries.length > 0 || scheduleStatusMessage) ? (
        <div
          className={`rounded-3xl border p-6 sm:p-8 ${
            rotationSummaries.length > 0
              ? "border-yellow-500/30 bg-yellow-500/10"
              : "border-white/10 bg-black/30"
          }`}
        >
          <p className={`text-sm uppercase tracking-[0.25em] ${titleGradient}`}>
            {t.analyze.scheduleContextTitle}
          </p>
          <p className="mt-2 text-sm text-[#A9A9A9]">
            {t.analyze.scheduleContextHint}
          </p>
          {rotationSummaries.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {rotationSummaries.map((item) => (
                <li
                  key={item}
                  className="rounded-2xl border border-yellow-500/20 bg-black/30 px-4 py-3 text-sm leading-6 text-[#E8E8E8]"
                >
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-[#A9A9A9]">
              {scheduleStatusMessage}
            </p>
          )}
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <div className={cardClass}>
          <p className={`text-sm uppercase tracking-[0.25em] ${titleGradient}`}>
            {t.analyze.scoreBreakdownBadge}
          </p>
          <h3 className="mt-2 text-2xl font-bold text-white">
            <span className="mr-2">📊</span>
            {t.analyze.scoreBreakdownTitle}
          </h3>
          <div className="mt-6 space-y-5">
            {Object.entries(breakdown).map(([key, value]) => (
              <div key={key}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="capitalize text-[#A9A9A9]">
                    {translateBreakdownKey(key, t)}
                  </span>
                  <span className="font-semibold text-[#18ff6d]">+{value}</span>
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
            ))}
          </div>
        </div>

        <div className={cardClass}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p
                className={`text-sm uppercase tracking-[0.25em] ${titleGradient}`}
              >
                {t.analyze.startingXiBadge}
              </p>
              <h3 className="mt-2 text-2xl font-bold text-white">
                <span className="mr-2">👥</span>
                {t.analyze.startingXi}
              </h3>
            </div>
            <span
              className={`rounded-full border px-4 py-2 text-xs font-bold ${
                confirmedLineups
                  ? "border-[#18ff6d44] bg-[#18ff6d]/10 text-[#18ff6d]"
                  : "border-yellow-500/40 bg-yellow-500/10 text-yellow-300"
              }`}
            >
              {confirmedLineups ? t.analyze.confirmed : t.analyze.awaiting}
            </span>
          </div>

          {!confirmedLineups && !partialLineups ? (
            <div className="mt-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5">
              <p className="font-semibold text-yellow-200">
                {t.analyze.lineupsNotPublished}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#A9A9A9]">
                {t.analyze.lineupsHint}
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {playerLineupStatus === "bench" ? (
                <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-100">
                  {t.analyze.playerOnBenchWarningReport}
                </div>
              ) : null}
              {playerLineupStatus === "not_in_squad" ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
                  {t.analyze.playerNotStartingWarningReport}
                </div>
              ) : null}
              {[homeLineup, awayLineup]
                .filter((lineup) => (lineup?.startXI?.length ?? 0) > 0)
                .map((lineup, teamIndex) => (
                  <div
                    key={lineup?.team?.id || teamIndex}
                    className="overflow-hidden rounded-2xl border border-[#18ff6d22] bg-black/35"
                  >
                    <div className="flex items-center gap-4 border-b border-white/10 p-5">
                      {lineup?.team?.logo ? (
                        <img
                          src={lineup.team.logo}
                          alt={lineup.team.name || t.common.teamAlt}
                          className="h-12 w-12 rounded-full bg-white p-1"
                        />
                      ) : null}
                      <div>
                        <p className="text-lg font-black text-white">
                          {lineup?.team?.name ||
                            (teamIndex === 0
                              ? t.analyze.homeTeam
                              : t.analyze.awayTeam)}
                        </p>
                        <p className="mt-1 text-sm text-[#18ff6d]">
                          {t.analyze.formation}{" "}
                          {lineup?.formation || t.analyze.notSpecified}
                        </p>
                        {lineup?.coach?.name ? (
                          <p className="mt-1 text-xs text-[#A9A9A9]">
                            {t.analyze.coach} {lineup.coach.name}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#777]">
                        {t.analyze.startingPlayers}
                      </p>
                      <div className="mt-4 space-y-2">
                        {(lineup?.startXI || []).map((player, playerIndex) => (
                          <div
                            key={player.id || `${player.name}-${playerIndex}`}
                            className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                              resolvedPlayerId && player.id === resolvedPlayerId
                                ? "border-[#18ff6d] bg-[#18ff6d]/10"
                                : "border-white/5 bg-[#101010]/80"
                            }`}
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#18ff6d]/10 text-sm font-black text-[#18ff6d]">
                                {player.number ?? "–"}
                              </span>
                              <span className="truncate font-semibold text-[#E8E8E8]">
                                {player.name || t.builder.unknownPlayer}
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

      <div className="grid gap-6 md:grid-cols-2">
        <div className={cardClass}>
          <p className={`text-sm uppercase tracking-[0.25em] ${titleGradient}`}>
            {t.analyze.matchConditions}
          </p>
          <h3 className="mt-2 text-2xl font-bold text-white">
            <span className="mr-2">🌦️</span>
            {t.analyze.weather}
          </h3>
          {weather ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                [t.analyze.temperature, `${weather.temperature ?? "-"}°C`],
                [t.analyze.weatherDesc, weather.description ?? "-"],
                [t.analyze.wind, `${weather.wind ?? "-"} km/h`],
                [t.analyze.humidity, `${weather.humidity ?? "-"}%`],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-[#18ff6d11] bg-black/35 p-5"
                >
                  <p className="text-sm text-[#A9A9A9]">{label}</p>
                  <p className="mt-2 text-2xl font-bold text-[#18ff6d]">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm leading-6 text-[#A9A9A9]">
              {t.analyze.noWeatherData}
            </p>
          )}
        </div>

        <div className={cardClass}>
          <p className={`text-sm uppercase tracking-[0.25em] ${titleGradient}`}>
            {t.analyze.matchOfficial}
          </p>
          <h3 className="mt-2 text-2xl font-bold text-white">
            <span className="mr-2">👨‍⚖️</span>
            {t.analyze.referee}
          </h3>
          <div className="mt-6 rounded-2xl border border-[#18ff6d11] bg-black/35 p-6">
            <p className="text-sm text-[#A9A9A9]">{t.analyze.matchOfficial}</p>
            <p
              className={`mt-3 text-3xl font-bold ${
                referee ? "text-[#18ff6d]" : "text-[#A9A9A9]"
              }`}
            >
              {referee || t.analyze.noRefereeData}
            </p>
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <p className={`text-sm uppercase tracking-[0.25em] ${titleGradient}`}>
          {t.analyze.teamFormBadge}
        </p>
        <h3 className="mt-2 text-2xl font-bold text-white">
          <span className="mr-2">📈</span>
          {t.analyze.lastFiveMatches}
        </h3>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {[
            [t.analyze.homeTeam, homeLastMatches],
            [t.analyze.awayTeam, awayLastMatches],
          ].map(([label, matches]) => (
            <div
              key={label as string}
              className="rounded-2xl border border-[#18ff6d11] bg-black/35 p-5"
            >
              <h4 className="font-bold text-[#18ff6d]">{label as string}</h4>
              <div className="mt-4 space-y-3">
                {(matches as LastMatch[]).length === 0 ? (
                  <p className="text-sm text-[#A9A9A9]">
                    {t.analyze.noMatchData}
                  </p>
                ) : (
                  (matches as LastMatch[]).map((match) => (
                    <div
                      key={match.fixture.id}
                      className="rounded-xl bg-[#101010]/80 p-3 text-sm text-[#D8D8D8] transition hover:bg-[#151515]"
                    >
                      <span className="mr-2">{resultIcon(match)}</span>
                      {matchText(match)}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={cardClass}>
        <p className={`text-sm uppercase tracking-[0.25em] ${titleGradient}`}>
          {t.analyze.injuriesBadge}
        </p>
        <h3 className="mt-2 text-2xl font-bold text-white">
          <span className="mr-2">🏥</span>
          {t.analyze.injuries}
        </h3>
        <div className="mt-6 space-y-3">
          {injuries.length === 0 ? (
            <p className="text-sm text-[#A9A9A9]">{t.analyze.noInjuries}</p>
          ) : (
            injuries.map((injury, index) => (
              <div
                key={`${injury.player?.name}-${index}`}
                className="flex items-center gap-4 rounded-2xl bg-black/35 p-4 text-sm"
              >
                {injury.team?.logo ? (
                  <img
                    src={injury.team.logo}
                    alt={injury.team.name || t.common.teamAlt}
                    className="h-9 w-9 rounded-full bg-white p-1"
                  />
                ) : null}
                <div>
                  <p className="font-semibold text-[#18ff6d]">
                    {injury.player?.name || t.builder.unknownPlayer}
                  </p>
                  <p className="mt-1 text-[#D8D8D8]">
                    {injury.team?.name || t.analyze.unknownTeam}
                  </p>
                  <p className="mt-1 text-[#A9A9A9]">
                    {injuryReason(injury, t.analyze.noInjuryReason)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {betText ? (
        <div className={cardClass}>
          <h3 className="text-2xl font-bold text-white">
            {t.analyze.yourBetIdea}
          </h3>
          <pre className="mt-5 whitespace-pre-wrap rounded-2xl bg-black/40 p-5 text-sm text-[#D8D8D8]">
            {betText}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
