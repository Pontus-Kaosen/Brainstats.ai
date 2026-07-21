"use client";

import { useEffect, useState } from "react";
import HomeCtaLink from "@/components/HomeCtaLink";
import { supabase } from "@/lib/supabase";
import { getHomeContent } from "@/lib/homeContent";
import { useLanguage } from "@/components/LanguageProvider";

export default function HomeHeroCtas() {
  const { language } = useLanguage();
  const t = getHomeContent(language);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!cancelled) {
        setIsLoggedIn(Boolean(session?.user));
      }
    }

    void loadSession();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(Boolean(session?.user));
    });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, []);

  if (isLoggedIn) {
    return (
      <div className="mt-6 grid w-full max-w-3xl grid-cols-1 gap-3 sm:mt-12 sm:grid-cols-2 sm:gap-4">
        <HomeCtaLink href="/analyze?mode=image" className="w-full sm:col-span-2">
          📸 {t.uploadBetSlipLoggedIn ?? t.uploadBetSlip}
        </HomeCtaLink>

        <HomeCtaLink href="/analyze" className="w-full">
          🧠 {t.analyzeNow ?? t.pasteBet}
        </HomeCtaLink>

        <HomeCtaLink href="/dashboard" className="w-full">
          📊 {t.openDashboard ?? "Dashboard"}
        </HomeCtaLink>

        <HomeCtaLink href="/builder" variant="secondary" className="w-full sm:col-span-2">
          ⚽ {t.buildBet}
        </HomeCtaLink>
      </div>
    );
  }

  return (
    <div className="mt-6 grid w-full max-w-3xl grid-cols-1 gap-3 sm:mt-12 sm:grid-cols-2 sm:gap-4">
      <HomeCtaLink
        href="/login?next=/analyze%3Fmode%3Dimage"
        className="w-full sm:col-span-2"
      >
        📸 {t.uploadBetSlip}
      </HomeCtaLink>

      <HomeCtaLink href="/login?next=/analyze" className="w-full">
        ✨ {t.signupFree}
      </HomeCtaLink>

      <HomeCtaLink href="/analyze?sample=1" className="w-full">
        📝 {t.pasteBet}
      </HomeCtaLink>

      <HomeCtaLink
        href="/analyze?sample=1"
        variant="secondary"
        className="w-full sm:col-span-2"
      >
        🧠 {t.sampleReportCta}
      </HomeCtaLink>

      <HomeCtaLink href="/builder" variant="secondary" className="w-full sm:col-span-2">
        ⚽ {t.buildBet}
      </HomeCtaLink>
    </div>
  );
}
