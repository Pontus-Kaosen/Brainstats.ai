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
      <div className="mt-10 flex w-full max-w-md flex-col gap-3 sm:mt-12">
        <HomeCtaLink href="/analyze" className="w-full">
          {t.analyzeNow ?? t.pasteBet}
        </HomeCtaLink>
        <HomeCtaLink href="/builder" variant="secondary" className="w-full">
          {t.buildBet}
        </HomeCtaLink>
      </div>
    );
  }

  return (
    <div className="mt-10 flex w-full max-w-md flex-col gap-3 sm:mt-12">
      <HomeCtaLink href="/analyze?sample=1" className="w-full">
        {t.sampleReportCta}
      </HomeCtaLink>
      <HomeCtaLink href="/builder" variant="secondary" className="w-full">
        {t.buildBet}
      </HomeCtaLink>
    </div>
  );
}
