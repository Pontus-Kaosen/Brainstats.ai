"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import FootballBackground from "@/components/FootballBackground";
import Navbar from "@/components/Navbar";
import ManageSubscriptionButton from "@/components/ManageSubscriptionButton";
import DailySlipsSection from "@/components/DailySlipsSection";

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
  { title: "Startsida", icon: "🏠", href: "/" },
  { title: "Builder", icon: "⚽", href: "/builder" },
  { title: "Ny analys", icon: "🧠", href: "/analyze" },
  { title: "Premium", icon: "💎", href: "/premium" },
];

const titleGradient =
  "bg-gradient-to-r from-[#18ff6d] via-[#E8DCC8] to-[#2fbfff] bg-clip-text text-transparent";

const cardClass =
  "brain-card rounded-3xl p-8 transition-all duration-300 hover:-translate-y-1";

function planLabel(plan: UserPlan) {
  if (plan === "elite") return "👑 Elite";
  if (plan === "pro") return "💎 Pro";
  return "🟢 Free";
}


export default function DashboardPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [plan, setPlan] = useState<UserPlan>("free");
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
          window.location.href = "/login?next=/dashboard";
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
            .select("plan")
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
      } catch (error) {
        console.error("Dashboard error:", error);

        if (!cancelled) {
          setDashboardError(
            error instanceof Error
              ? error.message
              : "Dashboarden kunde inte laddas."
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
  }, []);

  const averageScore =
    analyses.length > 0
      ? Math.round(
          analyses.reduce(
            (sum, item) => sum + (item.score || 0),
            0
          ) / analyses.length
        )
      : 0;

  const remainingToday =
    plan === "free"
      ? Math.max(0, 3 - todayCount).toString()
      : "∞";


  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-[#FAFAF8]">
      <FootballBackground />

      <div className="relative z-10">
        <Navbar />

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-10">
          <section className="overflow-hidden rounded-[2rem] border border-[#18ff6d22] bg-black/35 p-7 backdrop-blur-xl shadow-[0_0_80px_rgba(24,255,109,.12)] sm:p-10">
            <div className="inline-flex rounded-full border border-[#18ff6d33] bg-[#18ff6d]/10 px-4 py-2 text-sm font-semibold text-[#18ff6d]">
              📊 BrainStats Dashboard
            </div>

            <p
              className={`mt-8 text-sm uppercase tracking-[0.45em] ${titleGradient}`}
            >
              Analysis Center
            </p>

            <h1 className="mt-4 max-w-5xl text-4xl font-black leading-tight sm:text-6xl">
              Din analyscentral.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#A9A9A9]">
              Följ dina analyser, se dagens AI-kuponger och bygg nya
              spelidéer från ett premium AI-kontrollrum.
            </p>
          </section>

          {dashboardError && (
            <section className="mt-8 rounded-3xl border border-red-500/30 bg-red-500/10 p-6">
              <p className="font-bold text-red-300">
                Dashboarden kunde inte laddas
              </p>

              <p className="mt-2 text-sm text-red-200/80">
                {dashboardError}
              </p>
            </section>
          )}

          {loading ? (
            <section className="mt-10 rounded-3xl border border-[#18ff6d22] bg-black/30 p-8 text-center">
              <p className="font-semibold text-[#18ff6d]">
                Hämtar din Dashboard...
              </p>
            </section>
          ) : (
            <>
              <section className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {[
                  ["Totala analyser", total],
                  ["Genomsnittlig score", averageScore],
                  ["Plan", planLabel(plan)],
                  ["Kvar idag", remainingToday],
                ].map(([title, value]) => (
                  <div key={String(title)} className={cardClass}>
                    <p className="text-sm text-[#A9A9A9]">
                      {title}
                    </p>

                    <h3 className="mt-3 text-4xl font-black text-[#18ff6d] drop-shadow-[0_0_30px_rgba(24,255,109,.45)]">
                      {value}
                    </h3>
                  </div>
                ))}
              </section>

              <DailySlipsSection />


              <section className="mt-14 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                <div className={cardClass}>
                  <p
                    className={`text-sm uppercase tracking-[0.25em] ${titleGradient}`}
                  >
                    History
                  </p>

                  <h2 className="mt-2 text-2xl font-bold text-white">
                    Senaste analyser
                  </h2>

                  <div className="mt-6 space-y-4">
                    {analyses.length === 0 ? (
                      <p className="text-[#A9A9A9]">
                        Du har inga analyser ännu.
                      </p>
                    ) : (
                      analyses.slice(0, 10).map((analysis) => (
                        <a
                          key={analysis.id}
                          href={`/report/${analysis.id}`}
                          className="block rounded-2xl border border-[#18ff6d11] bg-black/35 p-5 transition hover:border-[#18ff6d55] hover:bg-black/50"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="min-w-0">
                              <h3 className="font-semibold text-white">
                                {analysis.match || "Okänd match"}
                              </h3>

                              <p className="mt-1 text-sm text-[#A9A9A9]">
                                Risk: {analysis.risk || "Okänd"} ·
                                Confidence:{" "}
                                {analysis.confidence || 0}%
                              </p>
                            </div>

                            <div className="shrink-0 text-3xl font-black text-[#18ff6d]">
                              {analysis.score || 0}
                            </div>
                          </div>

                          {analysis.summary && (
                            <p className="mt-4 line-clamp-4 text-sm leading-6 text-[#CFCFCF]">
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
                      Membership
                    </p>

                    <h3 className="mt-3 text-3xl font-bold text-white">
                      {plan === "free"
                        ? "Lås upp Pro."
                        : `Din plan: ${planLabel(plan)}`}
                    </h3>

                    <p className="mt-4 text-[#A9A9A9]">
                      {plan === "free"
                        ? "Få obegränsade analyser, djupare rapporter och fler AI-kuponger."
                        : "Hantera betalningsmetod, fakturor och ditt abonnemang."}
                    </p>

                    {plan === "free" && (
                      <a
                        href="/premium"
                        className="mt-8 inline-flex rounded-2xl border border-[#18ff6d55] bg-gradient-to-r from-[#18ff6d] via-[#3cffb4] to-[#2fbfff] px-6 py-4 font-bold text-black shadow-[0_0_35px_rgba(24,255,109,.35)] transition hover:-translate-y-1 hover:shadow-[0_0_55px_rgba(24,255,109,.65)]"
                      >
                        Se planer
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
                      Shortcuts
                    </p>

                    <h3 className="mt-2 text-xl font-bold text-white">
                      Snabbval
                    </h3>

                    <div className="mt-5 space-y-3">
                      {quickActions.map((action) => (
                        <a
                          key={action.title}
                          href={action.href}
                          className="flex items-center justify-between rounded-2xl border border-[#18ff6d11] bg-black/35 p-4 transition hover:border-[#18ff6d55] hover:bg-black/50"
                        >
                          <span>
                            {action.icon} {action.title}
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