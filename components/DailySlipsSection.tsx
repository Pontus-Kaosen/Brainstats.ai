"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AIBetSlip from "@/components/AIBetSlip";
import ResponsibleUseNotice from "@/components/ResponsibleUseNotice";
import { useLanguage } from "@/components/LanguageProvider";
import { formatTranslation, formatStockholmKickoffTime } from "@/lib/locale";

type SlipPick = {
  fixture?: string;
  match?: string;
  market?: string;
  probability?: number;
  estimatedOdds?: number;
  reason?: string;
  kickoffAt?: string;
};

type DailySlip = {
  id: string;
  valid_date: string;
  slip_index: number;
  title: string;
  risk: string;
  confidence: number;
  picks: SlipPick[];
  safetyTier?: number;
  safetyLabel?: string;
  safetyRank?: number;
};

type DailySlipsResponse = {
  success?: boolean;
  plan?: "free" | "pro" | "elite";
  slipLimit?: number;
  slips?: DailySlip[];
  error?: string;
};

export default function DailySlipsSection() {
  const { t, language } = useLanguage();
  const [slips, setSlips] = useState<DailySlip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [slipLimit, setSlipLimit] = useState(1);

  useEffect(() => {
    let cancelled = false;

    async function loadDailySlips() {
      setLoading(true);
      setError("");

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error(t.dailySlips.mustLogin);
        }

        const response = await fetch(
          `/api/daily-slips?lang=${language}`,
          {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          cache: "no-store",
        });

        const data = (await response.json()) as DailySlipsResponse;

        if (!response.ok || data.success === false) {
          throw new Error(data.error || t.dailySlips.errorDefault);
        }

        if (cancelled) return;

        setSlips(data.slips || []);
        setSlipLimit(data.slipLimit || 1);
      } catch (loadError) {
        console.error("Daily slips error:", loadError);

        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : t.dailySlips.errorDefault
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDailySlips();

    return () => {
      cancelled = true;
    };
  }, [language, t.dailySlips.errorDefault, t.dailySlips.mustLogin]);

  return (
    <section
      id="ai-tips"
      className="mt-6 scroll-mt-28 rounded-[2rem] border border-[#18ff6d33] bg-gradient-to-br from-[#18ff6d]/8 via-black/20 to-[#2fbfff]/8 p-4 shadow-[0_0_60px_rgba(24,255,109,.08)] sm:mt-8 sm:p-8"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between sm:gap-4">
        <div>
          <p className="brain-title text-xs font-bold uppercase tracking-[0.3em] sm:text-sm">
            {t.dailySlips.subtitle}
          </p>

          <h2 className="mt-2 text-2xl font-black sm:mt-3 sm:text-4xl">{t.dailySlips.title}</h2>

          <p className="mt-2 hidden max-w-2xl text-sm text-[#A9A9A9] md:block sm:mt-3">
            {t.dailySlips.description}
          </p>
        </div>

        <div className="rounded-full border border-[#18ff6d33] bg-[#18ff6d]/10 px-5 py-3 text-sm font-bold text-[#18ff6d]">
          {formatTranslation(t.dailySlips.available, {
            count: slips.length,
            limit: slipLimit,
          })}
        </div>
      </div>

      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#72d5ff] sm:text-sm">
        {t.dailySlips.todayOnlyBadge}
      </p>

      <p className="mt-3 hidden text-sm text-[#777] md:block sm:mt-4">{t.dailySlips.disclaimer}</p>

      <ResponsibleUseNotice compact className="mt-4 hidden md:flex" />

      {!loading && !error && slips.length > 0 && (
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4 sm:p-5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#18ff6d]">
            {t.dailySlips.rankingTitle}
          </p>
          <p className="mt-2 text-sm text-[#A9A9A9]">{t.dailySlips.rankingLegend}</p>
        </div>
      )}

      {loading && (
        <div className="mt-8 rounded-3xl border border-[#18ff6d22] bg-black/30 p-8 text-center">
          <p className="font-semibold text-[#18ff6d]">
            {t.dailySlips.loading}
          </p>

          <p className="mt-2 text-sm text-[#A9A9A9]">
            {t.dailySlips.loadingHint}
          </p>
        </div>
      )}

      {!loading && error && (
        <div className="mt-8 rounded-3xl border border-red-500/30 bg-red-500/10 p-6">
          <p className="font-bold text-red-300">{t.dailySlips.errorTitle}</p>

          <p className="mt-2 text-sm text-red-200/80">{error}</p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 rounded-2xl border border-red-400/40 px-5 py-3 font-bold text-red-200"
          >
            {t.dailySlips.retry}
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="mt-8 grid gap-7 xl:grid-cols-2">
          {slips.map((slip) => (
            <AIBetSlip
              key={slip.id}
              title={slip.safetyLabel || slip.title}
              confidence={slip.confidence}
              risk={slip.risk}
              safetyTier={slip.safetyTier as 1 | 2 | 3 | 4 | 5 | undefined}
              safetyLabel={slip.safetyLabel}
              safetyRank={slip.safetyRank ?? slip.safetyTier ?? slip.slip_index}
              picks={slip.picks.map((pick) => ({
                fixture:
                  pick.fixture || pick.match || t.dailySlips.unknownMatch,
                market: pick.market || t.dailySlips.unknownMarket,
                odds: Number(pick.estimatedOdds || 1),
                reason: pick.reason,
                kickoffLabel: pick.kickoffAt
                  ? formatTranslation(t.aiBetSlip.kickoffToday, {
                      time: formatStockholmKickoffTime(pick.kickoffAt, language),
                    })
                  : undefined,
              }))}
            />
          ))}
        </div>
      )}

      {!loading && !error && slips.length === 0 && (
        <p className="mt-6 text-sm text-yellow-200">
          {t.dailySlips.fewerThanExpected}
        </p>
      )}
    </section>
  );
}
