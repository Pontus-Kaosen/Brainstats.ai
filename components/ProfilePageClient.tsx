"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import FootballBackground from "@/components/FootballBackground";
import Navbar from "@/components/Navbar";
import ManageSubscriptionButton from "@/components/ManageSubscriptionButton";
import { useLanguage } from "@/components/LanguageProvider";
import { formatTranslation, getLocale } from "@/lib/locale";
import {
  buildProfileStats,
  displayNameFromEmail,
  initialsFromEmail,
  type ProfileAnalysisRow,
  type ProfileStats,
} from "@/lib/profileStats";
import { supabase } from "@/lib/supabase";
import type { UserPlan } from "@/lib/useUserPlan";

const titleGradient =
  "bg-gradient-to-r from-[#18ff6d] via-[#E8DCC8] to-[#2fbfff] bg-clip-text text-transparent";

const cardClass =
  "brain-card rounded-3xl p-4 transition-all duration-300 hover:-translate-y-1 sm:p-8";

const ANALYSIS_SELECT_FULL =
  "id, created_at, match, score, risk, confidence, summary, markets, worth_betting";
const ANALYSIS_SELECT_BASE =
  "id, created_at, match, score, risk, confidence, summary";

type ProfileState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      plan: UserPlan;
      email: string | null;
      createdAt: string | null;
      total: number;
      analyses: ProfileAnalysisRow[];
    };

function planLabel(plan: UserPlan, elite: string, pro: string, free: string) {
  if (plan === "elite") return elite;
  if (plan === "pro") return pro;
  return free;
}

function formatDate(value: string | null, language: "sv" | "en") {
  if (!value) return "–";
  return new Intl.DateTimeFormat(getLocale(language), {
    dateStyle: "medium",
  }).format(new Date(value));
}

function CountBar({
  label,
  count,
  max,
  color,
}: {
  label: string;
  count: number;
  max: number;
  color: string;
}) {
  const width = max > 0 ? Math.max(8, Math.round((count / max) * 100)) : 8;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="truncate text-[#D8D8D8]">{label}</span>
        <span className="shrink-0 font-bold text-white">{count}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/8">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

export default function ProfilePageClient() {
  const { t, language } = useLanguage();
  const [state, setState] = useState<ProfileState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          const nextTarget = `${window.location.pathname}${window.location.search}`;
          window.location.href = `/login?next=${encodeURIComponent(
            nextTarget || "/profile"
          )}`;
          return;
        }

        const [profileResult, totalResult] = await Promise.all([
          supabase
            .from("profiles")
            .select("plan")
            .eq("id", user.id)
            .maybeSingle(),
          supabase
            .from("analyses")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id),
        ]);

        if (profileResult.error) throw profileResult.error;
        if (totalResult.error) throw totalResult.error;

        const profilePlan = profileResult.data?.plan;
        const plan: UserPlan =
          profilePlan === "pro" || profilePlan === "elite" ? profilePlan : "free";

        let analyses: ProfileAnalysisRow[] = [];

        if (plan !== "free") {
          const fullQuery = await supabase
            .from("analyses")
            .select(ANALYSIS_SELECT_FULL)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(300);

          if (!fullQuery.error) {
            analyses = (fullQuery.data || []) as ProfileAnalysisRow[];
          } else {
            const baseQuery = await supabase
              .from("analyses")
              .select(ANALYSIS_SELECT_BASE)
              .eq("user_id", user.id)
              .order("created_at", { ascending: false })
              .limit(300);

            if (baseQuery.error) throw baseQuery.error;
            analyses = (baseQuery.data || []) as ProfileAnalysisRow[];
          }
        }

        if (cancelled) return;

        setState({
          status: "ready",
          plan,
          email: user.email || null,
          createdAt: user.created_at || null,
          total: totalResult.count || 0,
          analyses,
        });
      } catch (error) {
        console.error("Profile error:", error);
        if (!cancelled) {
          setState({
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : t.profile.loadErrorDefault,
          });
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [t.profile.loadErrorDefault]);

  const stats: ProfileStats | null = useMemo(() => {
    if (state.status !== "ready" || state.plan === "free") return null;
    return buildProfileStats(state.analyses, language);
  }, [state, language]);

  const verdictLabels: Record<string, string> = {
    worth_it: t.worthBetting.verdicts.worth_it,
    risky: t.worthBetting.verdicts.risky,
    not_worth_it: t.worthBetting.verdicts.not_worth_it,
    wait: t.worthBetting.verdicts.wait,
  };

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden brain-page">
      <FootballBackground />

      <div className="relative z-10">
        <Navbar />

        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-8 sm:py-10">
          {state.status === "loading" ? (
            <section className="rounded-3xl border border-[#18ff6d22] bg-black/30 p-8 text-center">
              <p className="font-semibold text-[#18ff6d]">{t.profile.loading}</p>
            </section>
          ) : null}

          {state.status === "error" ? (
            <section className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6">
              <p className="font-bold text-red-300">{t.profile.loadErrorTitle}</p>
              <p className="mt-2 text-sm text-red-200/80">{state.message}</p>
            </section>
          ) : null}

          {state.status === "ready" ? (
            <>
              <section className="mobile-hero overflow-hidden rounded-[2rem] border border-[#18ff6d22] bg-black/35 p-4 max-md:backdrop-blur-none backdrop-blur-xl shadow-[0_0_80px_rgba(24,255,109,.12)] sm:p-10 md:text-left">
                <p className="inline-flex rounded-full border border-[#18ff6d33] bg-[#18ff6d]/10 px-4 py-2 text-sm font-semibold text-[#18ff6d]">
                  {t.profile.badge}
                </p>

                <p
                  className={`mt-4 text-sm uppercase tracking-[0.45em] max-md:hidden sm:mt-8 ${titleGradient}`}
                >
                  {t.profile.title}
                </p>

                <div className="mt-4 flex flex-col gap-5 sm:mt-6 sm:flex-row sm:items-end">
                  <div
                    className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-black ring-1 ring-inset sm:h-20 sm:w-20 sm:text-2xl ${
                      state.plan === "elite"
                        ? "bg-[#0c0b09] text-[#F5EAD8] ring-[#E8DCC8]/55"
                        : state.plan === "pro"
                          ? "bg-[#08110c] text-[#18ff6d] ring-[#18ff6d]/45"
                          : "bg-[#111111] text-[#D8D8D8] ring-white/20"
                    }`}
                  >
                    {initialsFromEmail(state.email)}
                  </div>

                  <div className="min-w-0">
                    <h1 className="text-3xl font-black leading-tight text-white max-md:leading-snug sm:text-6xl">
                      {displayNameFromEmail(state.email) || t.profile.title}
                    </h1>
                    <p className="mt-2 truncate text-sm text-[#A9A9A9] sm:mt-3 sm:text-lg">
                      {state.email}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full border border-[#18ff6d33] bg-[#18ff6d]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#18ff6d]">
                    {planLabel(
                      state.plan,
                      t.common.planElite,
                      t.common.planPro,
                      t.common.planFree
                    )}
                  </span>
                  <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-[#A9A9A9]">
                    {formatTranslation(t.profile.memberSince, {
                      date: formatDate(state.createdAt, language),
                    })}
                  </span>
                </div>

                <p className="mt-4 hidden max-w-2xl text-lg leading-8 text-[#A9A9A9] md:block sm:mt-6">
                  {state.plan === "free"
                    ? t.profile.lockedDescription
                    : t.profile.description}
                </p>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#A9A9A9] md:hidden">
                  {state.plan === "free"
                    ? t.profile.lockedDescription
                    : t.profile.description}
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#18ff6d33] bg-[#18ff6d]/10 px-5 py-3 text-sm font-bold text-[#18ff6d] transition hover:bg-[#18ff6d]/15 sm:px-6 sm:text-base"
                  >
                    {t.navbar.dashboard}
                    <span aria-hidden>→</span>
                  </Link>
                  <Link
                    href="/analyze"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/12 bg-black/30 px-5 py-3 text-sm font-bold text-white transition hover:border-[#18ff6d]/35 sm:px-6 sm:text-base"
                  >
                    {t.dashboard.newAnalysis}
                  </Link>
                  {state.plan === "free" ? (
                    <Link
                      href="/premium"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#E8DCC8]/30 bg-[#E8DCC8]/10 px-5 py-3 text-sm font-bold text-[#F5EAD8] transition hover:bg-[#E8DCC8]/15 sm:px-6 sm:text-base"
                    >
                      {t.profile.lockedCta}
                    </Link>
                  ) : (
                    <ManageSubscriptionButton compact />
                  )}
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    className="inline-flex items-center justify-center rounded-2xl border border-white/10 px-5 py-3 text-sm font-semibold text-[#A9A9A9] transition hover:border-red-400/30 hover:text-red-300 sm:px-6"
                  >
                    {t.navbar.logout}
                  </button>
                </div>
              </section>

              {state.plan === "free" ? (
                <section className="mobile-hero mt-6 overflow-hidden rounded-[2rem] border border-[#E8DCC8]/25 bg-gradient-to-r from-[#E8DCC8]/10 via-[#18ff6d]/5 to-[#2fbfff]/10 p-5 sm:mt-8 sm:p-8 md:text-left">
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#E8DCC8]">
                    {t.profile.lockedBadge}
                  </p>
                  <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
                    {t.profile.lockedTitle}
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-[#A9A9A9] sm:text-base">
                    {t.profile.lockedText}
                  </p>
                  <ul className="mt-6 grid gap-3 text-sm text-[#D8D8D8] sm:grid-cols-3">
                    <li className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      {t.profile.lockPointStats}
                    </li>
                    <li className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      {t.profile.lockPointHistory}
                    </li>
                    <li className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      {t.profile.lockPointTrends}
                    </li>
                  </ul>
                  <Link
                    href="/premium"
                    className="mt-5 inline-flex rounded-2xl border border-[#E8DCC8]/35 bg-[#0a0a0a] px-5 py-3 text-sm font-bold text-[#F5EAD8] transition hover:border-[#E8DCC8]/55 hover:bg-[#111111]"
                  >
                    {t.profile.lockedCta} →
                  </Link>
                </section>
              ) : null}

              {state.plan !== "free" && stats ? (
                <>
                  <section className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-6 xl:grid-cols-4">
                    {[
                      [t.profile.statTotal, String(state.total)],
                      [t.profile.statAverage, String(stats.averageScore)],
                      [t.profile.statWeek, String(stats.thisWeek)],
                      [t.profile.statConfidence, `${stats.averageConfidence}%`],
                    ].map(([title, value]) => (
                      <div key={title} className={cardClass}>
                        <p className="text-sm text-[#A9A9A9]">{title}</p>
                        <h3 className="mt-2 text-2xl font-black text-[#18ff6d] sm:text-4xl">
                          {value}
                        </h3>
                      </div>
                    ))}
                  </section>

                  <section className="mt-6 grid gap-6 lg:grid-cols-2 sm:mt-8">
                    <div className={cardClass}>
                      <p className={`text-sm uppercase tracking-[0.25em] ${titleGradient}`}>
                        {t.profile.riskMix}
                      </p>
                      <h2 className="mt-2 text-2xl font-bold text-white">
                        {t.profile.riskTitle}
                      </h2>
                      <div className="mt-6 space-y-4">
                        {stats.riskBuckets.length === 0 ? (
                          <p className="text-sm text-[#A9A9A9]">{t.profile.emptyStats}</p>
                        ) : (
                          stats.riskBuckets.map((item) => (
                            <CountBar
                              key={item.label}
                              label={item.label}
                              count={item.count}
                              max={stats.sampleSize}
                              color="bg-[#18ff6d]"
                            />
                          ))
                        )}
                      </div>
                    </div>

                    <div className={cardClass}>
                      <p className={`text-sm uppercase tracking-[0.25em] ${titleGradient}`}>
                        {t.profile.verdictMix}
                      </p>
                      <h2 className="mt-2 text-2xl font-bold text-white">
                        {t.profile.verdictTitle}
                      </h2>
                      <div className="mt-6 space-y-4">
                        {stats.verdictBuckets.length === 0 ? (
                          <p className="text-sm text-[#A9A9A9]">{t.profile.emptyVerdicts}</p>
                        ) : (
                          stats.verdictBuckets.map((item) => (
                            <CountBar
                              key={item.label}
                              label={verdictLabels[item.label] || item.label}
                              count={item.count}
                              max={stats.sampleSize}
                              color="bg-[#2fbfff]"
                            />
                          ))
                        )}
                      </div>
                    </div>
                  </section>

                  <section className="mt-6 grid gap-6 lg:grid-cols-2 sm:mt-8">
                    <div className={cardClass}>
                      <p className={`text-sm uppercase tracking-[0.25em] ${titleGradient}`}>
                        {t.profile.activityBadge}
                      </p>
                      <h2 className="mt-2 text-2xl font-bold text-white">
                        {t.profile.activityTitle}
                      </h2>
                      <div className="mt-6 flex h-36 items-end gap-2">
                        {stats.weekActivity.map((week) => {
                          const max = Math.max(
                            1,
                            ...stats.weekActivity.map((item) => item.count)
                          );
                          const height = Math.round((week.count / max) * 100);
                          return (
                            <div
                              key={week.key}
                              className="flex min-w-0 flex-1 flex-col items-center gap-2"
                            >
                              <div
                                className="w-full rounded-t-lg bg-[#18ff6d]/80"
                                style={{ height: `${Math.max(6, height)}%` }}
                                title={`${week.label}: ${week.count}`}
                              />
                              <span className="text-[10px] text-[#6A6A6A]">
                                {week.count}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <p className="mt-4 text-xs text-[#6A6A6A]">
                        {t.profile.activityHint}
                      </p>
                    </div>

                    <div className={cardClass}>
                      <p className={`text-sm uppercase tracking-[0.25em] ${titleGradient}`}>
                        {t.profile.topBadge}
                      </p>
                      <h2 className="mt-2 text-2xl font-bold text-white">
                        {t.profile.topMatchesTitle}
                      </h2>
                      <div className="mt-6 space-y-3">
                        {stats.topMatches.length === 0 ? (
                          <p className="text-sm text-[#A9A9A9]">{t.profile.emptyStats}</p>
                        ) : (
                          stats.topMatches.map((item) => (
                            <div
                              key={item.label}
                              className="flex items-start justify-between gap-3 rounded-2xl border border-white/8 bg-black/30 px-4 py-3"
                            >
                              <p className="min-w-0 text-sm font-semibold text-white">
                                {item.label}
                              </p>
                              <span className="shrink-0 text-sm font-bold text-[#18ff6d]">
                                {item.count}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </section>

                  <section className={`mt-6 ${cardClass} sm:mt-8`}>
                    <p className={`text-sm uppercase tracking-[0.25em] ${titleGradient}`}>
                      {t.profile.marketsBadge}
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-white">
                      {t.profile.marketsTitle}
                    </h2>
                    {stats.topMarkets.length === 0 ? (
                      <p className="mt-4 text-sm text-[#A9A9A9]">{t.profile.emptyMarkets}</p>
                    ) : (
                      <div className="mt-6 flex flex-wrap gap-2">
                        {stats.topMarkets.map((item) => (
                          <span
                            key={item.label}
                            className="rounded-full border border-[#18ff6d33] bg-[#18ff6d]/10 px-4 py-2 text-sm text-[#E8E8E8]"
                          >
                            {item.label}
                            <span className="ml-2 font-bold text-[#18ff6d]">
                              {item.count}
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className={`mt-6 ${cardClass} sm:mt-8`}>
                    <p className={`text-sm uppercase tracking-[0.25em] ${titleGradient}`}>
                      {t.profile.historyBadge}
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-white">
                      {t.profile.historyTitle}
                    </h2>
                    <p className="mt-2 text-sm text-[#A9A9A9]">
                      {formatTranslation(t.profile.historyHint, {
                        count: Math.min(state.analyses.length, 40),
                        total: state.total,
                      })}
                    </p>

                    <div className="mt-6 space-y-4">
                      {state.analyses.length === 0 ? (
                        <div>
                          <p className="text-[#A9A9A9]">{t.dashboard.noAnalyses}</p>
                          <Link
                            href="/analyze?mode=image"
                            className="mt-4 inline-flex rounded-2xl border border-[#18ff6d55] bg-[#18ff6d]/10 px-5 py-3 text-sm font-bold text-[#18ff6d]"
                          >
                            {t.dashboard.emptyStateCta} →
                          </Link>
                        </div>
                      ) : (
                        state.analyses.slice(0, 40).map((analysis) => (
                          <Link
                            key={analysis.id}
                            href={`/report/${analysis.id}`}
                            className="block rounded-2xl border border-[#18ff6d11] bg-black/35 p-5 transition hover:border-[#18ff6d55] hover:bg-black/50"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="min-w-0">
                                <h3 className="font-semibold text-white">
                                  {analysis.match || t.dashboard.unknownMatch}
                                </h3>
                                <p className="mt-1 text-sm text-[#A9A9A9]">
                                  {formatDate(analysis.created_at, language)} ·{" "}
                                  {t.dashboard.risk}:{" "}
                                  {analysis.risk || t.dashboard.unknownMatch} ·{" "}
                                  {t.analyze.confidence}: {analysis.confidence || 0}%
                                </p>
                              </div>
                              <div className="shrink-0 text-3xl font-black text-[#18ff6d]">
                                {analysis.score || 0}
                              </div>
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  </section>
                </>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}
