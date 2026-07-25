"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import FootballBackground from "@/components/FootballBackground";
import DailySlipsSection from "@/components/DailySlipsSection";
import ResponsibleUseNotice from "@/components/ResponsibleUseNotice";
import LandingPageView from "@/components/LandingPageView";
import { useLanguage } from "@/components/LanguageProvider";
import type { LandingPageContent } from "@/lib/landingPages";

type UserPlan = "free" | "pro" | "elite";

type AuthState =
  | { status: "loading" }
  | { status: "guest" }
  | { status: "authenticated"; plan: UserPlan };

export default function AiTipsPageClient({
  landing,
}: {
  landing: LandingPageContent;
}) {
  const { t } = useLanguage();
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (error || !user) {
        setAuth({ status: "guest" });
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;

      const profilePlan = profile?.plan;
      setAuth({
        status: "authenticated",
        plan:
          profilePlan === "elite" || profilePlan === "pro" ? profilePlan : "free",
      });
    }

    void init();

    return () => {
      cancelled = true;
    };
  }, []);

  if (auth.status === "loading" || auth.status === "guest") {
    return <LandingPageView content={landing} />;
  }

  const plan = auth.plan;

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#050505] text-[#FAFAF8]">
      <FootballBackground />

      <div className="relative z-10">
        <Navbar />

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-12">
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
        </div>
      </div>
    </main>
  );
}
