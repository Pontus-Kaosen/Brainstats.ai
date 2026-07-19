"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { formatTranslation, translateRiskLevel } from "@/lib/locale";
import type { SafetyTier } from "@/lib/safetyGrades";

type Pick = {
  fixture: string;
  market: string;
  odds: number;
  reason?: string;
  kickoffLabel?: string;
};

type Props = {
  title: string;
  picks: Pick[];
  confidence: number;
  risk: string;
  safetyTier?: SafetyTier;
  safetyLabel?: string;
  safetyRank?: number;
};

export default function AIBetSlip({
  title,
  picks,
  confidence,
  risk,
  safetyTier,
  safetyLabel,
  safetyRank,
}: Props) {
  const { t } = useLanguage();

  const displayRisk = safetyLabel || translateRiskLevel(risk, t);
  const tier = safetyTier ?? safetyRank ?? 3;

  const totalOdds = picks.reduce((total, pick) => {
    const odds =
      Number.isFinite(pick.odds) && pick.odds > 0 ? pick.odds : 1;

    return total * odds;
  }, 1);

  return (
    <article className="overflow-hidden rounded-[2rem] border border-[#18ff6d33] bg-[#0b0f0d]/95 shadow-[0_0_45px_rgba(24,255,109,.12)]">
      <header className="border-b border-[#18ff6d22] bg-gradient-to-r from-[#18ff6d]/10 via-transparent to-[#2fbfff]/10 p-6 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#18ff6d]">
                {t.aiBetSlip.header}
              </p>

              {typeof safetyRank === "number" && (
                <span
                  className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${safetyTierClasses(tier)}`}
                >
                  {formatTranslation(t.aiBetSlip.rankLabel, {
                    rank: safetyRank,
                  })}
                </span>
              )}
            </div>

            <h3 className="mt-2 text-2xl font-black text-white">
              🧠 {title}
            </h3>

            {tier === 1 && (
              <p className="mt-1 text-xs font-semibold text-[#72d5ff]">
                {t.aiBetSlip.rankSafest}
              </p>
            )}

            {tier === 5 && (
              <p className="mt-1 text-xs font-semibold text-red-300/90">
                {t.aiBetSlip.rankHardest}
              </p>
            )}
          </div>

          <span
            className={`rounded-full border px-4 py-2 text-xs font-black ${safetyTierClasses(tier)}`}
          >
            {displayRisk}
          </span>
        </div>
      </header>

      <div className="divide-y divide-white/10">
        {picks.map((pick, index) => (
          <div
            key={`${pick.fixture}-${pick.market}-${index}`}
            className="p-6 transition hover:bg-white/[0.025]"
          >
            <div className="flex items-start justify-between gap-5">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#18ff6d]/10 text-xs font-black text-[#18ff6d]">
                    {index + 1}
                  </span>

                  <p className="font-bold text-white">{pick.fixture}</p>
                </div>

                {pick.kickoffLabel ? (
                  <p className="mt-2 pl-10 text-xs font-semibold uppercase tracking-[0.16em] text-[#72d5ff]">
                    {pick.kickoffLabel}
                  </p>
                ) : null}

                <p className="mt-3 pl-10 text-lg font-black text-[#18ff6d]">
                  {pick.market}
                </p>

                {pick.reason && (
                  <p className="mt-3 pl-10 text-sm leading-6 text-[#A9A9A9]">
                    {pick.reason}
                  </p>
                )}
              </div>

              <div className="shrink-0 rounded-xl border border-[#18ff6d33] bg-[#18ff6d]/10 px-4 py-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#A9A9A9]">
                  {t.aiBetSlip.fairOdds}
                </p>

                <p className="mt-1 text-2xl font-black text-[#18ff6d]">
                  {Number(pick.odds || 1).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <footer className="border-t border-[#18ff6d22] bg-black/35 p-6 sm:p-7">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="text-xs text-[#888]">{t.aiBetSlip.aiConfidence}</p>

            <p className="mt-2 text-2xl font-black text-[#18ff6d]">
              {confidence}%
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="text-xs text-[#888]">{t.aiBetSlip.safetyLevel}</p>

            <p className="mt-2 text-xl font-black text-white">{displayRisk}</p>
          </div>

          <div className="rounded-2xl border border-[#2fbfff33] bg-[#2fbfff]/5 p-4">
            <p className="text-xs text-[#888]">
              {t.aiBetSlip.combinedFairOdds}
            </p>

            <p className="mt-2 text-3xl font-black text-[#72d5ff]">
              {totalOdds.toFixed(2)}
            </p>
          </div>
        </div>

        <p className="mt-5 text-xs leading-5 text-[#666]">
          {t.aiBetSlip.disclaimer}
        </p>
      </footer>
    </article>
  );
}

function safetyTierClasses(tier: number) {
  if (tier <= 1) {
    return "border-[#18ff6d44] bg-[#18ff6d]/10 text-[#18ff6d]";
  }

  if (tier >= 5) {
    return "border-red-500/40 bg-red-500/10 text-red-300";
  }

  if (tier >= 4) {
    return "border-orange-500/40 bg-orange-500/10 text-orange-300";
  }

  if (tier >= 3) {
    return "border-yellow-500/40 bg-yellow-500/10 text-yellow-300";
  }

  return "border-[#2fbfff44] bg-[#2fbfff]/10 text-[#72d5ff]";
}
