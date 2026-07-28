"use client";

import { useMemo } from "react";
import AnalysisReportMatchData from "@/components/AnalysisReportMatchData";
import WorthBettingBlock from "@/components/WorthBettingBlock";
import { useLanguage } from "@/components/LanguageProvider";
import {
  formatTranslation,
  translateRiskLevel,
} from "@/lib/locale";
import type { AnalysisUsedData, ScoreBreakdown } from "@/lib/analysisReportTypes";
import type { WorthBetting } from "@/lib/worthBetting";

type BrainPick = {
  market: string;
  confidence?: number;
  probability?: number;
  estimatedOdds?: number;
  riskLevel?: string;
  reason: string;
};

type AnalyzeMatchReportProps = {
  matchLabel: string;
  aiResult: {
    summary: string;
    strengths: string[];
    risks: string[];
    recommendation: string;
    worthBetting?: WorthBetting;
    brainScore?: number;
    riskLevel?: string;
    confidence?: number;
    scoreBreakdown?: ScoreBreakdown;
    brainPick?: BrainPick | null;
    brainPicks?: BrainPick[];
  };
  usedData: AnalysisUsedData;
  blockBetText: string;
  showMatchHeading?: boolean;
};

const cardClass =
  "brain-card rounded-3xl p-8 transition-all duration-300 hover:-translate-y-1";

const titleGradient =
  "bg-gradient-to-r from-[#18ff6d] via-[#E8DCC8] to-[#2fbfff] bg-clip-text text-transparent";

function riskColor(risk?: string) {
  if (risk === "Low" || risk === "Lägre risk" || risk === "Lower risk") {
    return "border-green-500/30 bg-green-500/10 text-green-300";
  }

  if (risk === "High" || risk === "Högre risk" || risk === "Higher risk") {
    return "border-red-500/30 bg-red-500/10 text-red-300";
  }

  return "border-yellow-500/30 bg-yellow-500/10 text-yellow-200";
}

export default function AnalyzeMatchReport({
  matchLabel,
  aiResult,
  usedData,
  blockBetText,
  showMatchHeading = false,
}: AnalyzeMatchReportProps) {
  const { t } = useLanguage();

  const score = aiResult.brainScore ?? 0;
  const confidence = aiResult.confidence ?? 0;
  const risk = translateRiskLevel(aiResult.riskLevel, t);
  const breakdown = aiResult.scoreBreakdown || {};

  const brainPicks = useMemo(() => {
    if (Array.isArray(aiResult.brainPicks) && aiResult.brainPicks.length > 0) {
      return aiResult.brainPicks;
    }

    return aiResult.brainPick ? [aiResult.brainPick] : [];
  }, [aiResult]);

  return (
    <section className="space-y-8">
      {showMatchHeading ? (
        <div className="rounded-[2rem] border border-[#2fbfff33] bg-[#071018]/90 p-6 sm:p-8">
          <p className={`text-sm uppercase tracking-[0.35em] ${titleGradient}`}>
            {t.analyze.reportSubtitle}
          </p>
          <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
            {matchLabel}
          </h2>
        </div>
      ) : null}

      <div className="brain-card overflow-hidden rounded-[2rem] p-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className={`text-sm uppercase tracking-[0.45em] ${titleGradient}`}>
              {t.analyze.reportSubtitle}
            </p>

            <h2 className="mt-4 text-5xl font-black">
              {showMatchHeading ? matchLabel : t.analyze.reportTitle}
            </h2>

            <p className="mt-4 max-w-2xl leading-8 text-[#A9A9A9]">
              {aiResult.summary}
            </p>
          </div>

          <div className="relative flex h-56 w-56 items-center justify-center rounded-full border border-[#18ff6d33] bg-black/40 shadow-[0_0_80px_rgba(24,255,109,.22)]">
            <div className="absolute inset-4 rounded-full border border-[#18ff6d22]" />
            <div className="absolute inset-8 rounded-full border border-[#2fbfff22]" />

            <div className="text-center">
              <div className="text-7xl font-black text-[#18ff6d] drop-shadow-[0_0_40px_rgba(24,255,109,.75)]">
                {score}
              </div>
              <p className="mt-1 text-sm text-[#A9A9A9]">{t.analyze.brainScore}</p>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-[#18ff6d22] bg-black/35 p-5">
            <p className="text-sm text-[#A9A9A9]">{t.analyze.riskLevel}</p>
            <p className="mt-2 text-2xl font-bold text-[#18ff6d]">{risk}</p>
          </div>

          <div className="rounded-2xl border border-[#18ff6d22] bg-black/35 p-5">
            <p className="text-sm text-[#A9A9A9]">{t.analyze.confidence}</p>
            <p className="mt-2 text-2xl font-bold text-[#18ff6d]">{confidence}%</p>
          </div>

          <div className="rounded-2xl border border-[#18ff6d22] bg-black/35 p-5">
            <p className="text-sm text-[#A9A9A9]">{t.analyze.analysisMode}</p>
            <p className="mt-2 text-2xl font-bold text-[#18ff6d]">
              {t.analyze.liveAi}
            </p>
          </div>
        </div>

        <div className="mt-8">
          <div className="mb-3 flex justify-between text-sm">
            <span className="text-[#A9A9A9]">{t.analyze.brainScorePower}</span>
            <span className="font-semibold text-[#18ff6d]">{score}%</span>
          </div>

          <div className="h-5 overflow-hidden rounded-full bg-black/60">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#18ff6d] via-[#E8DCC8] to-[#2fbfff] transition-all duration-700"
              style={{ width: `${Math.min(score, 100)}%` }}
            />
          </div>
        </div>
      </div>

      <AnalysisReportMatchData
        usedData={usedData}
        breakdown={breakdown}
        betText={blockBetText}
      />

      {aiResult.worthBetting ? (
        <WorthBettingBlock worthBetting={aiResult.worthBetting} className="mt-8" />
      ) : null}

      <section>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className={`text-sm uppercase tracking-[0.25em] ${titleGradient}`}>
              {t.report.picksSubtitle}
            </p>
            <h3 className="mt-2 text-2xl font-black text-white sm:text-3xl">
              {t.report.picksTitle}
            </h3>
          </div>
          <p className="text-sm text-[#A9A9A9]">{t.report.fairOddsNote}</p>
        </div>

        {brainPicks.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-white/10 bg-black/30 p-8">
            <p className="text-[#A9A9A9]">{t.report.noPicks}</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {brainPicks.map((pick, index) => (
              <article
                key={`${pick.market}-${index}`}
                className="brain-card relative overflow-hidden rounded-3xl border border-[#18ff6d22] p-6 sm:p-7"
              >
                <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#18ff6d]/10 blur-[70px]" />

                <div className="relative">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="rounded-full border border-[#18ff6d33] bg-[#18ff6d]/10 px-4 py-2 text-sm font-black text-[#18ff6d]">
                      {formatTranslation(t.report.pickNumber, {
                        n: index + 1,
                      })}
                    </span>

                    <span
                      className={`rounded-full border px-4 py-2 text-sm font-bold ${riskColor(
                        pick.riskLevel
                      )}`}
                    >
                      {translateRiskLevel(pick.riskLevel, t)}{" "}
                      {t.common.riskSuffix}
                    </span>
                  </div>

                  <h4 className="mt-6 text-2xl font-black text-white sm:text-3xl">
                    {pick.market || t.report.unknownMarket}
                  </h4>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-[#18ff6d22] bg-black/35 p-5">
                      <p className="text-sm text-[#A9A9A9]">
                        {t.report.aiProbability}
                      </p>
                      <p className="mt-2 text-3xl font-black text-[#18ff6d]">
                        {pick.probability ?? pick.confidence ?? 0}%
                      </p>
                    </div>

                    <div className="rounded-2xl border border-[#2fbfff33] bg-black/35 p-5">
                      <p className="text-sm text-[#A9A9A9]">
                        {t.report.estimatedFairOdds}
                      </p>
                      <p className="mt-2 text-3xl font-black text-[#72d5ff]">
                        {Number(pick.estimatedOdds || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <p className="mt-6 leading-8 text-[#D8D8D8]">
                    {pick.reason || t.report.noReason}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <div className={cardClass}>
          <h3 className="text-2xl font-bold text-white">
            <span className="mr-2">👍</span>
            {t.analyze.strengths}
          </h3>
          <ul className="mt-5 space-y-3 text-[#D8D8D8]">
            {aiResult.strengths.map((item) => (
              <li key={item}>✓ {item}</li>
            ))}
          </ul>
        </div>

        <div className={cardClass}>
          <h3 className="text-2xl font-bold text-white">
            <span className="mr-2">⚠</span>
            {t.analyze.risks}
          </h3>
          <ul className="mt-5 space-y-3 text-[#D8D8D8]">
            {aiResult.risks.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className={cardClass}>
        <h3 className="text-2xl font-bold text-white">
          <span className="mr-2">💡</span>
          {t.analyze.recommendation}
        </h3>
        <p className="mt-5 leading-8 text-[#D8D8D8]">{aiResult.recommendation}</p>
      </div>
    </section>
  );
}
