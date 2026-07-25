"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ValueBetCard from "@/components/ValueBetCard";
import ResponsibleUseNotice from "@/components/ResponsibleUseNotice";
import ProductExplain from "@/components/ProductExplain";
import { useLanguage } from "@/components/LanguageProvider";
import { formatKickoffLabel, formatTranslation } from "@/lib/locale";
import { localizeMarketLabel } from "@/lib/marketOdds";
import { getValueBetGrade, VALUE_BET_GRADES } from "@/lib/valueBetGrades";
import ValueStars from "@/components/ValueStars";

type ValueBetPick = {
  match: string;
  market: string;
  league: string;
  kickoffAt?: string | null;
  fairProbability: number;
  fairOdds: number;
  marketOdds: number;
  impliedProbability: number;
  edgePercent: number;
  reason: string;
  valueTier?: number;
  valueRank?: number;
};

type ValueBetsResponse = {
  success?: boolean;
  plan?: "free" | "pro" | "elite";
  picks?: ValueBetPick[];
  fixtureScope?: string;
  referenceDateKey?: string;
  requiresElite?: boolean;
  message?: string;
  error?: string;
};

export default function ValueBetsSection() {
  const { t, language } = useLanguage();
  const [picks, setPicks] = useState<ValueBetPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requiresElite, setRequiresElite] = useState(false);
  const [emptyMessage, setEmptyMessage] = useState("");
  const [referenceDateKey, setReferenceDateKey] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadValueBets() {
      setLoading(true);
      setError("");
      setRequiresElite(false);
      setEmptyMessage("");

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error(t.valueBets.mustLogin);
        }

        const response = await fetch(`/api/value-bets?lang=${language}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          cache: "no-store",
        });

        const data = (await response.json()) as ValueBetsResponse;

        if (!response.ok || data.success === false) {
          if (data.requiresElite) {
            if (!cancelled) {
              setRequiresElite(true);
            }
            return;
          }

          throw new Error(data.error || t.valueBets.errorDefault);
        }

        if (cancelled) return;

        setPicks(data.picks || []);
        setEmptyMessage(data.message || "");
        setReferenceDateKey(data.referenceDateKey || "");
      } catch (loadError) {
        console.error("Value bets error:", loadError);

        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : t.valueBets.errorDefault
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadValueBets();

    return () => {
      cancelled = true;
    };
  }, [language, t.valueBets.errorDefault, t.valueBets.mustLogin]);

  return (
    <section
      id="value-bets"
      className="mt-6 scroll-mt-28 rounded-[2rem] border border-[#72d5ff33] bg-gradient-to-br from-[#2fbfff]/8 via-black/20 to-[#18ff6d]/8 p-4 shadow-[0_0_60px_rgba(47,191,255,.08)] sm:mt-8 sm:p-8"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between sm:gap-4">
        <div>
          <p className="brain-title text-xs font-bold uppercase tracking-[0.3em] sm:text-sm">
            {t.valueBets.subtitle}
          </p>
          <h2 className="mt-2 text-2xl font-black sm:mt-3 sm:text-4xl">
            {t.valueBets.title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[#A9A9A9] sm:mt-3">
            {t.valueBets.description}
          </p>
        </div>

        <div className="rounded-full border border-[#72d5ff33] bg-[#2fbfff]/10 px-5 py-3 text-sm font-bold text-[#72d5ff]">
          {t.common.planElite}
        </div>
      </div>

      <ProductExplain
        variant="valueBets"
        title={t.valueBets.explainTitle}
        text={t.valueBets.explainText}
        differentNote={t.valueBets.differentNote}
        differentHref="#ai-tips"
        differentLink={t.valueBets.differentLink}
      />

      <p className="mt-3 text-sm text-[#777] sm:mt-4">{t.valueBets.disclaimer}</p>
      <ResponsibleUseNotice compact className="mt-4 flex" />

      {requiresElite ? (
        <div className="mt-5 rounded-2xl border border-[#72d5ff33] bg-[#2fbfff]/10 p-4 sm:p-5">
          <p className="font-bold text-[#72d5ff]">{t.valueBets.eliteCta}</p>
          <p className="mt-2 text-sm text-[#A9A9A9]">{t.valueBets.eliteHint}</p>
          <a
            href="/premium"
            className="mt-4 inline-flex rounded-full bg-[#72d5ff] px-5 py-2.5 text-sm font-bold text-black transition hover:opacity-90"
          >
            {t.valueBets.upgradeCta} →
          </a>
        </div>
      ) : null}

      {loading ? (
        <div className="mt-8 rounded-3xl border border-[#72d5ff22] bg-black/30 p-8 text-center">
          <p className="font-semibold text-[#72d5ff]">{t.valueBets.loading}</p>
          <p className="mt-2 text-sm text-[#A9A9A9]">{t.valueBets.loadingHint}</p>
        </div>
      ) : null}

      {!loading && error ? (
        <div className="mt-8 rounded-3xl border border-red-500/30 bg-red-500/10 p-6">
          <p className="font-bold text-red-300">{t.valueBets.errorTitle}</p>
          <p className="mt-2 text-sm text-red-200/80">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 rounded-2xl border border-red-400/40 px-5 py-3 font-bold text-red-200"
          >
            {t.valueBets.retry}
          </button>
        </div>
      ) : null}

      {!loading && !error && !requiresElite && picks.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-[#72d5ff22] bg-black/30 p-8 text-center">
          <p className="font-semibold text-[#72d5ff]">
            {emptyMessage || t.valueBets.empty}
          </p>
        </div>
      ) : null}

      {!loading && !error && picks.length > 0 ? (
        <>
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4 sm:p-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#18ff6d]">
              {t.valueBets.rankingTitle}
            </p>
            <p className="mt-2 text-sm text-[#A9A9A9]">{t.valueBets.rankingIntro}</p>
            <div className="mt-4 space-y-2">
              {VALUE_BET_GRADES.map((grade) => {
                const label =
                  language === "en" ? grade.labelEn : grade.labelSv;

                return (
                  <div
                    key={grade.tier}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#18ff6d11] bg-black/20 px-3 py-2"
                  >
                    <ValueStars tier={grade.tier} label={label} size="sm" />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {picks.map((pick) => (
              <ValueBetCard
                key={`${pick.match}-${pick.market}`}
                pick={{
                  ...pick,
                  market: localizeMarketLabel(pick.market, language),
                }}
                gradeLabel={
                  pick.valueTier
                    ? getValueBetGrade(pick.valueTier, language).label
                    : undefined
                }
                rankLabel={
                  typeof pick.valueRank === "number"
                    ? formatTranslation(t.valueBets.rankLabel, {
                        rank: pick.valueRank,
                      })
                    : undefined
                }
                labels={{
                  fairOdds: t.valueBets.fairOdds,
                  marketOdds: t.valueBets.marketOdds,
                  edge: t.valueBets.edge,
                  fairProbability: t.valueBets.fairProbability,
                  impliedProbability: t.valueBets.impliedProbability,
                  valueGrade: t.valueBets.valueGrade,
                }}
                kickoffLabel={
                  pick.kickoffAt && referenceDateKey
                    ? formatKickoffLabel(
                        pick.kickoffAt,
                        referenceDateKey,
                        language,
                        t
                      )
                    : null
                }
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
