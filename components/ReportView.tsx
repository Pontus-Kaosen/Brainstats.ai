"use client";

import Navbar from "@/components/Navbar";
import FootballBackground from "@/components/FootballBackground";
import AnalysisExecutiveSummary from "@/components/AnalysisExecutiveSummary";
import CollapsibleReportSection from "@/components/CollapsibleReportSection";
import { useLanguage } from "@/components/LanguageProvider";
import {
  formatTranslation,
  translateRiskLevel,
} from "@/lib/locale";
import type { WorthBetting } from "@/lib/worthBetting";

type BrainPick = {
  id?: number;
  market?: string;
  probability?: number;
  estimatedOdds?: number;
  riskLevel?: string;
  reason?: string;
};

export type ReportAnalysis = {
  match?: string | null;
  score?: number | null;
  risk?: string | null;
  confidence?: number | null;
  summary?: string | null;
  recommendation?: string | null;
  worth_betting?: WorthBetting | null;
  brain_picks?: BrainPick[] | null;
  strengths?: string[] | null;
  risks?: string[] | null;
};

type ReportViewProps = {
  analysis: ReportAnalysis | null;
  loading?: boolean;
};

const titleGradient =
  "bg-gradient-to-r from-[#18ff6d] via-[#E8DCC8] to-[#2fbfff] bg-clip-text text-transparent";

const cardClass = "brain-card rounded-3xl p-6 sm:p-8";

function riskColor(risk?: string) {
  if (risk === "Low") {
    return "border-[#18ff6d44] bg-[#18ff6d]/10 text-[#18ff6d]";
  }

  if (risk === "High") {
    return "border-red-500/40 bg-red-500/10 text-red-300";
  }

  return "border-yellow-500/40 bg-yellow-500/10 text-yellow-300";
}

export default function ReportView({
  analysis,
  loading = false,
}: ReportViewProps) {
  const { t } = useLanguage();

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050505] px-4 py-10 text-white sm:px-8">
        <div className="mx-auto max-w-5xl">
          <section className="mt-10 rounded-3xl border border-[#18ff6d22] bg-black/30 p-8 text-center">
            <p className="font-semibold text-[#18ff6d]">{t.common.loading}</p>
          </section>
        </div>
      </main>
    );
  }

  if (!analysis) {
    return (
      <main className="min-h-screen bg-[#050505] px-4 py-10 text-white sm:px-8">
        <div className="mx-auto max-w-5xl">
          <a
            href="/dashboard"
            className="font-semibold text-[#18ff6d] hover:underline"
          >
            {t.report.backDashboard}
          </a>

          <section className="mt-10 rounded-3xl border border-red-500/30 bg-red-500/10 p-8">
            <h1 className="text-4xl font-black">{t.report.notFoundTitle}</h1>
            <p className="mt-4 text-red-200/80">{t.report.notFoundText}</p>
          </section>
        </div>
      </main>
    );
  }

  const brainPicks: BrainPick[] = Array.isArray(analysis.brain_picks)
    ? analysis.brain_picks
    : [];

  const strengths: string[] = Array.isArray(analysis.strengths)
    ? analysis.strengths
    : [];

  const risks: string[] = Array.isArray(analysis.risks) ? analysis.risks : [];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-[#FAFAF8]">
      <FootballBackground />

      <div className="relative z-10">
        <Navbar />

        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <a
              href="/dashboard"
              className="font-semibold text-[#18ff6d] transition hover:opacity-75"
            >
              {t.report.backDashboard}
            </a>

            <div className="rounded-full border border-[#18ff6d33] bg-[#18ff6d]/10 px-4 py-2 text-sm font-semibold text-[#18ff6d]">
              {t.report.badge}
            </div>
          </div>

          <section className="mt-8 overflow-hidden rounded-[2rem] border border-[#18ff6d22] bg-black/35 p-7 backdrop-blur-xl shadow-[0_0_80px_rgba(24,255,109,.12)] sm:p-10">
            <p
              className={`text-sm uppercase tracking-[0.35em] ${titleGradient}`}
            >
              {t.report.subtitle}
            </p>

            <h1 className="mt-5 text-4xl font-black sm:text-6xl">
              {analysis.match || t.report.unknownMatch}
            </h1>

            <p className="mt-5 max-w-3xl leading-8 text-[#A9A9A9]">
              {t.report.description}
            </p>

            <p className="mt-3 max-w-3xl text-sm text-[#777]">
              {t.report.disclaimer}
            </p>
          </section>

          <section className="mt-8 grid gap-6 md:grid-cols-3">
            <div className={cardClass}>
              <p className="text-sm text-[#A9A9A9]">{t.report.brainScore}</p>

              <h2 className="mt-3 text-6xl font-black text-[#18ff6d] drop-shadow-[0_0_35px_rgba(24,255,109,.5)]">
                {analysis.score ?? 0}
              </h2>

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-black/50">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#18ff6d] to-[#2fbfff]"
                  style={{
                    width: `${Math.min(Number(analysis.score || 0), 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className={cardClass}>
              <p className="text-sm text-[#A9A9A9]">{t.report.riskLevel}</p>

              <div
                className={`mt-5 inline-flex rounded-full border px-5 py-3 text-2xl font-black ${riskColor(
                  analysis.risk ?? undefined
                )}`}
              >
                {translateRiskLevel(analysis.risk ?? undefined, t)}
              </div>
            </div>

            <div className={cardClass}>
              <p className="text-sm text-[#A9A9A9]">{t.report.confidence}</p>

              <h2 className="mt-3 text-5xl font-black text-[#18ff6d]">
                {analysis.confidence ?? 0}%
              </h2>
            </div>
          </section>

          <section className={`mt-8 ${cardClass}`}>
            <p
              className={`text-sm uppercase tracking-[0.25em] ${titleGradient}`}
            >
              {t.report.summarySubtitle}
            </p>

            <h2 className="mt-2 text-2xl font-black">
              {t.report.summaryTitle}
            </h2>

            <AnalysisExecutiveSummary
              summary={analysis.summary || t.report.noSummary}
              brainScore={Number(analysis.score || 0)}
              riskLevel={analysis.risk}
              confidence={analysis.confidence}
              worthBetting={analysis.worth_betting ?? null}
              showJumpLink={false}
            />
          </section>

          <section className="mt-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p
                  className={`text-sm uppercase tracking-[0.25em] ${titleGradient}`}
                >
                  {t.report.picksSubtitle}
                </p>

                <h2 className="mt-2 text-3xl font-black">
                  {t.report.picksTitle}
                </h2>
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
                    className="brain-card relative overflow-hidden rounded-3xl border border-[#18ff6d22] p-7"
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

                      <h3 className="mt-6 text-3xl font-black text-white">
                        {pick.market || t.report.unknownMarket}
                      </h3>

                      <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl border border-[#18ff6d22] bg-black/35 p-5">
                          <p className="text-sm text-[#A9A9A9]">
                            {t.report.aiProbability}
                          </p>

                          <p className="mt-2 text-3xl font-black text-[#18ff6d]">
                            {pick.probability ?? 0}%
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

          <section className="mt-8 grid gap-6 md:grid-cols-2">
            <CollapsibleReportSection title={t.report.strengths} defaultOpen>
              {strengths.length === 0 ? (
                <p className="text-[#A9A9A9]">{t.report.noStrengths}</p>
              ) : (
                <ul className="space-y-4 text-[#D8D8D8]">
                  {strengths.map((item, index) => (
                    <li key={`${item}-${index}`} className="flex gap-3">
                      <span className="text-[#18ff6d]">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CollapsibleReportSection>

            <CollapsibleReportSection title={t.report.risksTitle} defaultOpen>
              {risks.length === 0 ? (
                <p className="text-[#A9A9A9]">{t.report.noRisks}</p>
              ) : (
                <ul className="space-y-4 text-[#D8D8D8]">
                  {risks.map((item, index) => (
                    <li key={`${item}-${index}`} className="flex gap-3">
                      <span className="text-yellow-300">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CollapsibleReportSection>
          </section>

          <section className="mt-8 rounded-3xl border border-[#18ff6d33] bg-[#07140d]/80 p-7 sm:p-8">
            <p
              className={`text-sm uppercase tracking-[0.25em] ${titleGradient}`}
            >
              {t.report.verdictSubtitle}
            </p>

            <h2 className="mt-2 text-2xl font-black">
              {t.report.verdictTitle}
            </h2>

            <p className="mt-5 whitespace-pre-wrap leading-8 text-[#D8D8D8]">
              {analysis.recommendation || t.report.noRecommendation}
            </p>

            <a
              href="/analyze"
              className="mt-6 inline-flex rounded-2xl border border-[#18ff6d55] bg-[#18ff6d]/10 px-5 py-3 text-sm font-bold text-[#18ff6d] transition hover:bg-[#18ff6d]/15"
            >
              {t.report.analyzeSimilar} →
            </a>
          </section>
        </div>
      </div>
    </main>
  );
}
