"use client";

import Link from "next/link";
import ValueBetsHistorySnippet from "@/components/ValueBetsHistorySnippet";
import { useLanguage } from "@/components/LanguageProvider";
import { formatTranslation } from "@/lib/locale";

type ValueBetHistoryStats = {
  resolved: number;
  hits: number;
  hitRate: number | null;
  pending: number;
};

type PremiumTrustSectionProps = {
  valueBetStats: ValueBetHistoryStats | null;
  valueBetEntries: Array<{
    id: string;
    match_label: string;
    market: string;
    outcome: "pending" | "won" | "lost" | "void";
  }>;
  analysisHitRate: number | null;
  analysisResolved: number;
};

export default function PremiumTrustSection({
  valueBetStats,
  valueBetEntries,
  analysisHitRate,
  analysisResolved,
}: PremiumTrustSectionProps) {
  const { t } = useLanguage();

  return (
    <section className="mx-auto mt-10 max-w-4xl">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#E8DCC8]">
          {t.premium.trust.badge}
        </p>
        <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
          {t.premium.trust.title}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#A9A9A9]">
          {t.premium.trust.description}
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {analysisHitRate !== null && analysisResolved > 0 ? (
          <div className="rounded-[2rem] border border-[#18ff6d33] bg-[#18ff6d]/5 p-6 text-center sm:text-left">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#18ff6d]">
              {t.premium.trust.analysisLabel}
            </p>
            <p className="mt-3 text-4xl font-black text-[#18ff6d]">
              {Math.round(analysisHitRate)}%
            </p>
            <p className="mt-2 text-sm text-[#A9A9A9]">
              {formatTranslation(t.premium.trust.analysisDetail, {
                resolved: analysisResolved,
              })}
            </p>
            <Link
              href="/track-record"
              className="mt-4 inline-flex text-sm font-bold text-[#18ff6d] hover:underline"
            >
              {t.premium.trust.trackRecordLink} →
            </Link>
          </div>
        ) : null}

        {valueBetStats &&
        valueBetStats.hitRate !== null &&
        valueBetStats.resolved > 0 ? (
          <div className="rounded-[2rem] border border-[#72d5ff33] bg-[#2fbfff]/5 p-6 text-center sm:text-left">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#72d5ff]">
              {t.premium.trust.valueBetsLabel}
            </p>
            <p className="mt-3 text-4xl font-black text-[#72d5ff]">
              {Math.round(valueBetStats.hitRate)}%
            </p>
            <p className="mt-2 text-sm text-[#A9A9A9]">
              {formatTranslation(t.valueBetsHistory.hitRateDetail, {
                hits: valueBetStats.hits,
                resolved: valueBetStats.resolved,
              })}
            </p>
            <Link
              href="/value-bets"
              className="mt-4 inline-flex text-sm font-bold text-[#72d5ff] hover:underline"
            >
              {t.premium.trust.valueBetsLink} →
            </Link>
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/analyze?sample=1"
          className="inline-flex rounded-full border border-white/15 bg-black/40 px-5 py-3 text-sm font-bold text-white transition hover:border-[#18ff6d55]"
        >
          {t.premium.trust.sampleReportCta} →
        </Link>
        <Link
          href="/track-record"
          className="inline-flex rounded-full border border-[#18ff6d33] bg-[#18ff6d]/10 px-5 py-3 text-sm font-bold text-[#18ff6d] transition hover:bg-[#18ff6d]/15"
        >
          {t.premium.trust.trackRecordLink} →
        </Link>
      </div>

      <ValueBetsHistorySnippet
        initialEntries={valueBetEntries}
        initialStats={valueBetStats}
        pollLive={false}
        ctaHref="/value-bets"
        showUpgradeLink
      />
    </section>
  );
}
