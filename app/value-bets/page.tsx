"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import FootballBackground from "@/components/FootballBackground";
import ValueBetsSection from "@/components/ValueBetsSection";
import ResponsibleUseNotice from "@/components/ResponsibleUseNotice";
import { useLanguage } from "@/components/LanguageProvider";

export default function ValueBetsPage() {
  const { t } = useLanguage();
  const [ready, setReady] = useState(false);
  const [isElite, setIsElite] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        window.location.href = `/login?next=${encodeURIComponent("/value-bets")}`;
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;

      setIsElite(profile?.plan === "elite");
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
            <section className="rounded-3xl border border-[#72d5ff22] bg-black/30 p-8 text-center">
              <p className="font-semibold text-[#72d5ff]">{t.valueBets.loading}</p>
            </section>
          ) : !isElite ? (
            <section className="rounded-[2rem] border border-[#72d5ff33] bg-[#2fbfff]/10 p-6 sm:p-10">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#72d5ff]">
                {t.common.planElite}
              </p>
              <h1 className="mt-3 text-3xl font-black sm:text-4xl">
                {t.valueBetsPage.eliteGateTitle}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#A9A9A9] sm:text-base">
                {t.valueBetsPage.eliteGateText}
              </p>
              <a
                href="/premium"
                className="mt-6 inline-flex rounded-full bg-[#72d5ff] px-6 py-3 text-sm font-bold text-black transition hover:opacity-90"
              >
                {t.valueBets.upgradeCta} →
              </a>
            </section>
          ) : (
            <>
              <section className="rounded-[2rem] border border-[#72d5ff33] bg-black/35 p-5 sm:p-10">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#72d5ff]">
                  {t.valueBetsPage.badge}
                </p>
                <h1 className="mt-3 text-3xl font-black sm:text-5xl">
                  {t.valueBetsPage.title}
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-[#A9A9A9] sm:text-base">
                  {t.valueBetsPage.description}
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {t.valueBetsPage.steps.map((step) => (
                    <div
                      key={step.title}
                      className="rounded-2xl border border-[#72d5ff22] bg-[#2fbfff]/5 p-4"
                    >
                      <p className="font-bold text-[#72d5ff]">{step.title}</p>
                      <p className="mt-2 text-sm leading-6 text-[#A9A9A9]">
                        {step.text}
                      </p>
                    </div>
                  ))}
                </div>

                <Link
                  href="/ai-tips"
                  className="mt-6 inline-flex text-sm font-bold text-[#18ff6d] transition hover:text-[#7dffb0]"
                >
                  {t.valueBetsPage.aiTipsLink} →
                </Link>

                <ResponsibleUseNotice compact className="mt-6 flex" />
              </section>

              <ValueBetsSection hideHeader />
            </>
          )}
        </div>
      </div>
    </main>
  );
}
