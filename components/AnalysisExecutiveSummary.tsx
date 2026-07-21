"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import WorthBettingBlock from "@/components/WorthBettingBlock";
import { translateRiskLevel } from "@/lib/locale";
import type { WorthBetting } from "@/lib/worthBetting";

type AnalysisExecutiveSummaryProps = {
  summary: string;
  brainScore: number;
  riskLevel?: string | null;
  confidence?: number | null;
  worthBetting?: WorthBetting | null;
  showJumpLink?: boolean;
};

const titleGradient =
  "bg-gradient-to-r from-[#18ff6d] via-[#E8DCC8] to-[#2fbfff] bg-clip-text text-transparent";

function riskColor(risk?: string | null) {
  if (risk === "Low") {
    return "border-green-500/30 bg-green-500/10 text-green-300";
  }

  if (risk === "High") {
    return "border-red-500/30 bg-red-500/10 text-red-300";
  }

  return "border-yellow-500/30 bg-yellow-500/10 text-yellow-200";
}

export default function AnalysisExecutiveSummary({
  summary,
  brainScore,
  riskLevel,
  confidence,
  worthBetting,
  showJumpLink = true,
}: AnalysisExecutiveSummaryProps) {
  const { t } = useLanguage();

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-[#18ff6d33] bg-[#07140d]/80 p-6 sm:p-8">
        <p className={`text-sm uppercase tracking-[0.25em] ${titleGradient}`}>
          {t.analyze.executiveSummaryBadge}
        </p>

        <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-lg leading-8 text-[#D8D8D8] sm:text-xl">{summary}</p>

            {showJumpLink ? (
              <a
                href="#brain-picks"
                className="mt-4 inline-flex text-sm font-bold text-[#18ff6d] hover:underline"
              >
                {t.analyze.jumpToPicks} ↓
              </a>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-col items-center gap-4 sm:flex-row lg:flex-col">
            <div className="flex h-28 w-28 items-center justify-center rounded-full border border-[#18ff6d33] bg-black/40 shadow-[0_0_50px_rgba(24,255,109,.18)]">
              <div className="text-center">
                <div className="text-4xl font-black text-[#18ff6d]">{brainScore}</div>
                <p className="text-xs text-[#A9A9A9]">{t.analyze.brainScore}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-1">
              <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-center">
                <p className="text-xs text-[#A9A9A9]">{t.analyze.riskLevel}</p>
                <p
                  className={`mt-1 inline-flex rounded-full border px-3 py-1 text-sm font-bold ${riskColor(riskLevel)}`}
                >
                  {translateRiskLevel(riskLevel ?? undefined, t)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-center">
                <p className="text-xs text-[#A9A9A9]">{t.analyze.confidence}</p>
                <p className="mt-1 text-lg font-black text-[#18ff6d]">
                  {confidence ?? 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {worthBetting ? <WorthBettingBlock worthBetting={worthBetting} /> : null}
    </section>
  );
}
