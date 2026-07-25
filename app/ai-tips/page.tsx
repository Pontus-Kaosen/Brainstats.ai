"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import FootballBackground from "@/components/FootballBackground";
import DailySlipsSection from "@/components/DailySlipsSection";
import ResponsibleUseNotice from "@/components/ResponsibleUseNotice";
import { useLanguage } from "@/components/LanguageProvider";

type UserPlan = "free" | "pro" | "elite";

export default function AiTipsPage() {
  const { t } = useLanguage();
  const [ready, setReady] = useState(false);
  const [plan, setPlan] = useState<UserPlan>("free");

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        window.location.href = `/login?next=${encodeURIComponent("/ai-tips")}`;
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;

      const profilePlan = profile?.plan;
      setPlan(
        profilePlan === "elite" || profilePlan === "pro" ? profilePlan : "free"
      );
      setReady(true);
    }

    void init();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#050505] text-[#FAFAF8]">
      <FootballBackground />

      <div className="relative z-10">
        <Navbar />

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-12">
          {!ready ? (
            <section className="rounded-3xl border border-[#18ff6d22] bg-black/30 p-8 text-center">
              <p className="font-semibold text-[#18ff6d]">{t.dailySlips.loading}</p>
            </section>
          ) : (
            <>
              <section className="rounded-[2rem] border border-[#18ff6d22] bg-black/35 p-5 sm:p-10">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#18ff6d]">
                  {t.aiTipsPage.badge}
                </p>
                <h1 className="mt-3 text-3xl font-black sm:text-5xl">
                  {t.aiTipsPage.title}
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-[#A9A9A9] sm:text-base">
                  {t.aiTipsPage.description}
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {t.aiTipsPage.steps.map((step) => (
                    <div
                      key={step.title}
                      className="rounded-2xl border border-[#18ff6d22] bg-[#18ff6d]/5 p-4"
                    >
                      <p className="font-bold text-[#18ff6d]">{step.title}</p>
                      <p className="mt-2 text-sm leading-6 text-[#A9A9A9]">
                        {step.text}
                      </p>
                    </div>
                  ))}
                </div>

                {plan === "elite" ? (
                  <Link
                    href="/value-bets"
                    className="mt-6 inline-flex text-sm font-bold text-[#72d5ff] transition hover:text-[#9de5ff]"
                  >
                    {t.aiTipsPage.valueBetsLink} →
                  </Link>
                ) : null}

                <ResponsibleUseNotice compact className="mt-6 flex" />
              </section>

              <DailySlipsSection showValueBetsLink={plan === "elite"} hideHeader />
            </>
          )}
        </div>
      </div>
    </main>
  );
}
