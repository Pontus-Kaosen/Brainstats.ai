"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { formatTranslation } from "@/lib/locale";

type TrackRecordStats = {
  resolved: number;
  hits: number;
  hitRate: number | null;
  pending: number;
};

export default function TrackRecordSnippet() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<TrackRecordStats | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      try {
        const response = await fetch("/api/track-record", { cache: "no-store" });
        const data = await response.json();

        if (!cancelled && data?.stats?.resolved > 0) {
          setStats(data.stats);
        }
      } catch {
        // Ignore — snippet stays hidden without data
      }
    }

    void loadStats();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!stats || stats.hitRate === null) {
    return null;
  }

  return (
    <p className="mt-4 inline-flex rounded-2xl border border-[#18ff6d33] bg-[#18ff6d]/10 px-4 py-2 text-sm text-[#D8D8D8]">
      {formatTranslation(t.home.trackRecordStat, {
        rate: Math.round(stats.hitRate),
        resolved: stats.resolved,
      })}{" "}
      <Link href="/track-record" className="ml-2 font-bold text-[#18ff6d] hover:underline">
        {t.home.trackRecordStatLink}
      </Link>
    </p>
  );
}
