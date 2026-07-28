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
  sectionId?: string;
};

const cardClass = "brain-card rounded-2xl p-5";

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
  sectionId,
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

  const heroTitle = showMatchHeading ? matchLabel : t.analyze.reportTitle;

  return (
    <section id={sectionId} className="scroll-mt-24 space-y-5">
      <div className={`${cardClass} overflow-hidden`}>
        <div className="flex gap-4 sm:gap-5">
          <div className="min-w-0 flex-1">
            <p className={`text-xs uppercase tracking-[0.35em] ${titleGradient}`}>
              {t.analyze.reportSubtitle}
            </p>

            <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">
              {heroTitle}
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#A9A9A9] sm:text-[15px] sm:leading-7">
              {aiResult.summary}
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
              {[
                [t.analyze.riskLevel, risk],
                [t.analyze.confidence, `${confidence}%`],
                [t.analyze.analysisMode, t.analyze.liveAi],
              ].map(([label, value]) => (
                <div
                  key={label as string}
                  className="rounded-xl border border-[#18ff6d22] bg-black/35 px-3 py-2.5"
                >
                  <p className="text-[10px] uppercase tracking-wide text-[#888] sm:text-xs">
                    {label as string}
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#18ff6d] sm:text-base">
                    {value as string}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-3">
              <div className="mb-1.5 flex justify-between text-xs sm:text-sm">
                <span className="text-[#A9A9A9]">{t.analyze.brainScorePower}</span>
                <span className="font-semibold text-[#18ff6d]">{score}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-black/60 sm:h-3">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#18ff6d] via-[#E8DCC8] to-[#2fbfff] transition-all duration-700"
                  style={{ width: `${Math.min(score, 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="relative flex h-24 w-24 shrink-0 items-center justify-center self-start rounded-full border border-[#18ff6d33] bg-black/40 shadow-[0_0_40px_rgba(24,255,109,.18)] sm:h-28 sm:w-28">
            <div className="absolute inset-3 rounded-full border border-[#18ff6d22]" />
            <div className="text-center">
              <div className="text-4xl font-black text-[#18ff6d] sm:text-5xl">
                {score}
              </div>
              <p className="mt-0.5 text-[10px] text-[#A9A9A9] sm:text-xs">
                {t.analyze.brainScore}
              </p>
            </div>
          </div>
        </div>
      </div>

      <AnalysisReportMatchData
        usedData={usedData}
        breakdown={breakdown}
        betText={blockBetText}
        compact
      />

      {aiResult.worthBetting ? (
        <WorthBettingBlock
          worthBetting={aiResult.worthBetting}
          compact
        />
      ) : null}

      <section>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className={`text-xs uppercase tracking-[0.25em] ${titleGradient}`}>
              {t.report.picksSubtitle}
            </p>
            <h3 className="mt-1 text-xl font-black text-white sm:text-2xl">
              {t.report.picksTitle}
            </h3>
          </div>
          <p className="text-xs text-[#A9A9A9] sm:text-sm">{t.report.fairOddsNote}</p>
        </div>

        {brainPicks.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-5">
            <p className="text-sm text-[#A9A9A9]">{t.report.noPicks}</p>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {brainPicks.map((pick, index) => (
              <article
                key={`${pick.market}-${index}`}
                className="brain-card relative overflow-hidden rounded-2xl border border-[#18ff6d22] p-5"
              >
                <div className="relative">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full border border-[#18ff6d33] bg-[#18ff6d]/10 px-3 py-1.5 text-xs font-black text-[#18ff6d]">
                      {formatTranslation(t.report.pickNumber, {
                        n: index + 1,
                      })}
                    </span>

                    <span
                      className={`rounded-full border px-3 py-1.5 text-xs font-bold ${riskColor(
                        pick.riskLevel
                      )}`}
                    >
                      {translateRiskLevel(pick.riskLevel, t)}{" "}
                      {t.common.riskSuffix}
                    </span>
                  </div>

                  <h4 className="mt-4 text-xl font-black text-white">
                    {pick.market || t.report.unknownMarket}
                  </h4>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-[#18ff6d22] bg-black/35 p-3.5">
                      <p className="text-xs text-[#A9A9A9]">
                        {t.report.aiProbability}
                      </p>
                      <p className="mt-1 text-2xl font-black text-[#18ff6d]">
                        {pick.probability ?? pick.confidence ?? 0}%
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#2fbfff33] bg-black/35 p-3.5">
                      <p className="text-xs text-[#A9A9A9]">
                        {t.report.estimatedFairOdds}
                      </p>
                      <p className="mt-1 text-2xl font-black text-[#72d5ff]">
                        {Number(pick.estimatedOdds || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-[#D8D8D8] sm:leading-7">
                    {pick.reason || t.report.noReason}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className={cardClass}>
          <h3 className="text-lg font-bold text-white">
            <span className="mr-2">👍</span>
            {t.analyze.strengths}
          </h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-[#D8D8D8]">
            {aiResult.strengths.map((item) => (
              <li key={item}>✓ {item}</li>
            ))}
          </ul>
        </div>

        <div className={cardClass}>
          <h3 className="text-lg font-bold text-white">
            <span className="mr-2">⚠</span>
            {t.analyze.risks}
          </h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-[#D8D8D8]">
            {aiResult.risks.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>

        <div className={`${cardClass} lg:col-span-1`}>
          <h3 className="text-lg font-bold text-white">
            <span className="mr-2">💡</span>
            {t.analyze.recommendation}
          </h3>
          <p className="mt-3 text-sm leading-6 text-[#D8D8D8] sm:leading-7">
            {aiResult.recommendation}
          </p>
        </div>
      </div>
    </section>
  );
}
