"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import FootballBackground from "@/components/FootballBackground";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/components/LanguageProvider";
import ManageSubscriptionButton from "@/components/ManageSubscriptionButton";
import DailySlipsSection from "@/components/DailySlipsSection";
import OnboardingChecklist from "@/components/OnboardingChecklist";
import { useIsMobile } from "@/lib/useMediaQuery";
import { formatTranslation } from "@/lib/locale";
import type { Translations } from "@/lib/translations";

type UserPlan = "free" | "pro" | "elite";

type Analysis = {
  id: string;
  created_at: string;
  match: string | null;
  score: number | null;
  risk: string | null;
  confidence: number | null;
  summary: string | null;
};

const quickActions = [
  { key: "aiTips" as const, icon: "🎯", href: "/dashboard#ai-tips" },
  { key: "home" as const, icon: "🏠", href: "/" },
  { key: "builder" as const, icon: "⚽", href: "/builder" },
  { key: "analyze" as const, icon: "🧠", href: "/analyze" },
  { key: "premium" as const, icon: "💎", href: "/premium" },
];

const titleGradient =
  "bg-gradient-to-r from-[#18ff6d] via-[#E8DCC8] to-[#2fbfff] bg-clip-text text-transparent";

const cardClass =
  "brain-card rounded-3xl p-4 transition-all duration-300 hover:-translate-y-1 sm:p-8";

function planLabel(plan: UserPlan, t: Translations) {
  if (plan === "elite") return t.common.planElite;
  if (plan === "pro") return t.common.planPro;
  return t.common.planFree;
}


export default function DashboardPage() {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [plan, setPlan] = useState<UserPlan>("free");
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(
    null
  );
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setDashboardError("");

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          const nextTarget = `${window.location.pathname}${window.location.search}${window.location.hash}`;

          window.location.href = `/login?next=${encodeURIComponent(
            nextTarget || "/dashboard"
          )}`;
          return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [
          recentResult,
          totalResult,
          todayResult,
          profileResult,
        ] = await Promise.all([
          supabase
            .from("analyses")
            .select(
              "id, created_at, match, score, risk, confidence, summary"
            )
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(20),

          supabase
            .from("analyses")
            .select("*", {
              count: "exact",
              head: true,
            })
            .eq("user_id", user.id),

          supabase
            .from("analyses")
            .select("*", {
              count: "exact",
              head: true,
            })
            .eq("user_id", user.id)
            .gte("created_at", today.toISOString()),

          supabase
            .from("profiles")
            .select("plan, subscription_status, current_period_end")
            .eq("id", user.id)
            .maybeSingle(),
        ]);

        if (recentResult.error) throw recentResult.error;
        if (totalResult.error) throw totalResult.error;
        if (todayResult.error) throw todayResult.error;
        if (profileResult.error) throw profileResult.error;

        if (cancelled) return;

        setAnalyses((recentResult.data || []) as Analysis[]);
        setTotal(totalResult.count || 0);
        setTodayCount(todayResult.count || 0);

        const profilePlan = profileResult.data?.plan;

        if (
          profilePlan === "free" ||
          profilePlan === "pro" ||
          profilePlan === "elite"
        ) {
          setPlan(profilePlan);
        } else {
          setPlan("free");
        }

        setSubscriptionStatus(profileResult.data?.subscription_status ?? null);
        setTrialEndsAt(profileResult.data?.current_period_end ?? null);
      } catch (error) {
        console.error("Dashboard error:", error);

        if (!cancelled) {
          setDashboardError(
            error instanceof Error
              ? error.message
              : t.dashboard.loadErrorDefault
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [t.dashboard.loadErrorDefault]);

  useEffect(() => {
    if (loading || window.location.hash !== "#ai-tips") {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      document
        .getElementById("ai-tips")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [loading]);

  const quickActionLabels: Record<
    (typeof quickActions)[number]["key"],
    string
  > = {
    aiTips: t.navbar.aiTips,
    home: t.dashboard.quickHome,
    builder: t.navbar.builder,
    analyze: t.dashboard.newAnalysis,
    premium: t.navbar.premium,
  };

  const averageScore =
    analyses.length > 0
      ? Math.round(
          analyses.reduce(
            (sum, item) => sum + (item.score || 0),
            0
          ) / analyses.length
        )
      : 0;

  const remainingTodayNum =
    plan === "free" ? Math.max(0, 3 - todayCount) : null;

  const remainingToday =
    plan === "free" ? remainingTodayNum?.toString() ?? "0" : "∞";

  const trialDaysLeft =
    subscriptionStatus === "trialing" && trialEndsAt
      ? Math.max(
          0,
          Math.ceil(
            (new Date(trialEndsAt).getTime() - Date.now()) / 86_400_000
          )
        )
      : null;


  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#050505] text-[#FAFAF8]">
      <FootballBackground />

      <div className="relative z-10">
        <Navbar />

        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-8 sm:py-10">
          <section className="mobile-hero overflow-hidden rounded-[2rem] border border-[#18ff6d22] bg-black/35 p-4 max-md:backdrop-blur-none backdrop-blur-xl shadow-[0_0_80px_rgba(24,255,109,.12)] sm:p-10 md:text-left">
            <div className="inline-flex rounded-full border border-[#18ff6d33] bg-[#18ff6d]/10 px-4 py-2 text-sm font-semibold text-[#18ff6d]">
              {t.dashboard.badge}
            </div>

            <p
              className={`mt-4 text-sm uppercase tracking-[0.45em] max-md:hidden sm:mt-8 ${titleGradient}`}
            >
              {t.dashboard.subtitle}
            </p>

            <h1 className="mt-3 max-w-5xl text-3xl font-black leading-tight max-md:leading-snug sm:mt-4 sm:text-6xl">
              {t.dashboard.title}
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#A9A9A9] md:hidden sm:text-base">
              {t.dashboard.aiTipsHero}
            </p>

            <p className="mt-4 hidden max-w-2xl text-lg leading-8 text-[#A9A9A9] md:block sm:mt-6">
              {t.dashboard.description}
            </p>

            <a
              href="#ai-tips"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-[#E8DCC8]/30 bg-gradient-to-r from-[#18ff6d]/10 via-[#E8DCC8]/10 to-[#2fbfff]/10 px-5 py-3 text-sm font-bold text-[#E8DCC8] transition hover:border-[#E8DCC8]/50 hover:bg-[#18ff6d]/15 sm:mt-8 sm:px-6 sm:text-base"
            >
              🎯 {t.dashboard.viewAiTips}
              <span aria-hidden>↓</span>
            </a>
          </section>

          <OnboardingChecklist analysisCount={total} />

          {!loading && trialDaysLeft !== null && plan === "pro" ? (
            <section className="mt-6 rounded-[2rem] border border-[#18ff6d33] bg-[#18ff6d]/10 p-5 sm:mt-8 sm:p-6">
              <p className="text-sm font-bold text-[#18ff6d]">
                {trialDaysLeft === 0
                  ? t.dashboard.trialEndsToday
                  : formatTranslation(t.dashboard.trialDaysLeft, {
                      days: trialDaysLeft,
                    })}
              </p>
            </section>
          ) : null}

          {!loading && plan === "free" && remainingTodayNum !== null && remainingTodayNum > 0 ? (
            <section className="mt-6 rounded-2xl border border-[#18ff6d22] bg-black/30 px-5 py-4 text-sm text-[#A9A9A9] sm:mt-8">
              {formatTranslation(t.dashboard.remainingNudge, {
                remaining: remainingTodayNum,
              })}
            </section>
          ) : null}

          {!loading && plan === "free" ? (
            <section className="mobile-hero mt-6 overflow-hidden rounded-[2rem] border border-[#E8DCC8]/25 bg-gradient-to-r from-[#E8DCC8]/10 via-[#18ff6d]/5 to-[#2fbfff]/10 p-5 sm:mt-8 sm:p-8 md:text-left">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#E8DCC8]">
                {t.premium.proTrialBadge}
              </p>
              <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
                {t.dashboard.upgradeBannerTitle}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#A9A9A9] sm:text-base">
                {t.dashboard.upgradeBannerText}
              </p>
              <a
                href="/premium"
                className="mt-5 inline-flex rounded-2xl border border-[#E8DCC8]/35 bg-[#0a0a0a] px-5 py-3 text-sm font-bold text-[#F5EAD8] transition hover:border-[#E8DCC8]/55 hover:bg-[#111111]"
              >
                {t.dashboard.upgradeBannerCta} →
              </a>
            </section>
          ) : null}

          {dashboardError && (
            <section className="mt-8 rounded-3xl border border-red-500/30 bg-red-500/10 p-6">
              <p className="font-bold text-red-300">
                {t.dashboard.loadErrorTitle}
              </p>

              <p className="mt-2 text-sm text-red-200/80">
                {dashboardError}
              </p>
            </section>
          )}

          {loading ? (
            <section className="mt-10 rounded-3xl border border-[#18ff6d22] bg-black/30 p-8 text-center">
              <p className="font-semibold text-[#18ff6d]">
                {t.dashboard.loading}
              </p>
            </section>
          ) : (
            <>
              <DailySlipsSection />

              <section className="mt-6 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-6 xl:grid-cols-4">
                {[
                  [t.dashboard.totalAnalyses, total],
                  [t.dashboard.averageScore, averageScore],
                  [t.dashboard.plan, planLabel(plan, t)],
                  [t.dashboard.remainingToday, remainingToday],
                ].map(([title, value]) => (
                  <div key={String(title)} className={cardClass}>
                    <p className="text-sm text-[#A9A9A9]">
                      {title}
                    </p>

                    <h3 className="mt-2 text-2xl font-black text-[#18ff6d] drop-shadow-[0_0_30px_rgba(24,255,109,.45)] sm:mt-3 sm:text-4xl">
                      {value}
                    </h3>
                  </div>
                ))}
              </section>

              <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] sm:mt-14">
                <div className={cardClass}>
                  <p
                    className={`text-sm uppercase tracking-[0.25em] ${titleGradient}`}
                  >
                    {t.dashboard.history}
                  </p>

                  <h2 className="mt-2 text-2xl font-bold text-white">
                    {t.dashboard.recentAnalyses}
                  </h2>

                  <div className="mt-6 space-y-4">
                    {analyses.length === 0 ? (
                      <div>
                        <p className="text-[#A9A9A9]">{t.dashboard.noAnalyses}</p>
                        <a
                          href="/analyze?mode=image"
                          className="mt-4 inline-flex rounded-2xl border border-[#18ff6d55] bg-[#18ff6d]/10 px-5 py-3 text-sm font-bold text-[#18ff6d] transition hover:bg-[#18ff6d]/15"
                        >
                          {t.dashboard.emptyStateCta} →
                        </a>
                      </div>
                    ) : (
                      analyses.slice(0, isMobile ? 5 : 10).map((analysis) => (
                        <a
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
                                {t.dashboard.risk}: {analysis.risk || t.dashboard.unknownMatch} ·
                                {t.analyze.confidence}:{" "}
                                {analysis.confidence || 0}%
                              </p>
                            </div>

                            <div className="shrink-0 text-3xl font-black text-[#18ff6d]">
                              {analysis.score || 0}
                            </div>
                          </div>

                          {analysis.summary && (
                            <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#CFCFCF] sm:mt-4 sm:line-clamp-4">
                              {analysis.summary}
                            </p>
                          )}
                        </a>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className={cardClass}>
                    <p
                      className={`text-sm uppercase tracking-[0.25em] ${titleGradient}`}
                    >
                      {t.dashboard.membership}
                    </p>

                    <h3 className="mt-3 text-3xl font-bold text-white">
                      {plan === "free"
                        ? t.dashboard.unlockPro
                        : `${t.dashboard.yourPlan} ${planLabel(plan, t)}`}
                    </h3>

                    <p className="mt-4 text-[#A9A9A9]">
                      {plan === "free"
                        ? t.dashboard.freeUpsell
                        : t.dashboard.paidManage}
                    </p>

                    {plan === "free" && (
                      <a
                        href="/premium"
                        className="mt-8 inline-flex rounded-2xl border border-[#18ff6d55] bg-gradient-to-r from-[#18ff6d] via-[#3cffb4] to-[#2fbfff] px-6 py-4 font-bold text-black shadow-[0_0_35px_rgba(24,255,109,.35)] transition hover:-translate-y-1 hover:shadow-[0_0_55px_rgba(24,255,109,.65)]"
                      >
                        {t.dashboard.seePlans}
                      </a>
                    )}

                    {plan !== "free" && (
                      <ManageSubscriptionButton />
                    )}
                  </div>

                  <div className={cardClass}>
                    <p
                      className={`text-sm uppercase tracking-[0.25em] ${titleGradient}`}
                    >
                      {t.dashboard.shortcuts}
                    </p>

                    <h3 className="mt-2 text-xl font-bold text-white">
                      {t.dashboard.quickActions}
                    </h3>

                    <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:space-y-3 lg:grid-cols-1 lg:gap-0">
                      {quickActions.map((action) => (
                        <a
                          key={action.key}
                          href={action.href}
                          className="flex items-center justify-between rounded-2xl border border-[#18ff6d11] bg-black/35 p-3 text-sm transition hover:border-[#18ff6d55] hover:bg-black/50 sm:p-4 sm:text-base"
                        >
                          <span>
                            {action.icon}{" "}
                            {quickActionLabels[action.key]}
                          </span>

                          <span className="text-[#18ff6d]">
                            →
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </main>
  );
}