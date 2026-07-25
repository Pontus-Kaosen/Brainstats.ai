"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { formatTranslation } from "@/lib/locale";
import { localizeMarketLabel } from "@/lib/marketOdds";
import ValueStars from "@/components/ValueStars";

type ValueBetHistoryEntry = {
  id: string;
  match_label: string;
  market: string;
  outcome: "pending" | "won" | "lost" | "void";
  safety_tier: number | null;
  probability: number | null;
  published_at: string;
  note: string | null;
};

type ValueBetHistoryStats = {
  resolved: number;
  hits: number;
  hitRate: number | null;
  pending: number;
};

function outcomeLabel(
  outcome: ValueBetHistoryEntry["outcome"],
  t: ReturnType<typeof useLanguage>["t"]
) {
  if (outcome === "won") return t.valueBetsHistory.won;
  if (outcome === "lost") return t.valueBetsHistory.lost;
  if (outcome === "void") return t.valueBetsHistory.void;
  return t.valueBetsHistory.pending;
}

function outcomeClass(outcome: ValueBetHistoryEntry["outcome"]) {
  if (outcome === "won") return "text-[#18ff6d]";
  if (outcome === "lost") return "text-red-400";
  if (outcome === "pending") return "text-[#E8DCC8]";
  return "text-[#A9A9A9]";
}

export default function ValueBetsHistorySnippet() {
  const { t, language } = useLanguage();
  const [entries, setEntries] = useState<ValueBetHistoryEntry[]>([]);
  const [stats, setStats] = useState<ValueBetHistoryStats | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      try {
        const response = await fetch("/api/value-bets/history", {
          cache: "no-store",
        });
        const data = await response.json();

        if (cancelled || !Array.isArray(data?.entries)) {
          return;
        }

        setEntries(data.entries.slice(0, 10));
        setStats(data.stats || null);
      } catch {
        // Keep section hidden when unavailable
      }
    }

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, []);

  if (entries.length === 0) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-[#72d5ff33] bg-gradient-to-br from-[#2fbfff]/8 via-black/30 to-[#18ff6d]/5 p-5 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#72d5ff]">
            {t.valueBetsHistory.badge}
          </p>
          <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
            {t.valueBetsHistory.title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#A9A9A9]">
            {t.valueBetsHistory.description}
          </p>
        </div>

        {stats && stats.hitRate !== null && stats.resolved > 0 ? (
          <div className="rounded-2xl border border-[#18ff6d33] bg-[#18ff6d]/10 px-5 py-4 text-center">
            <p className="text-xs uppercase tracking-[0.18em] text-[#777]">
              {t.valueBetsHistory.hitRateLabel}
            </p>
            <p className="mt-1 text-3xl font-black text-[#18ff6d]">
              {Math.round(stats.hitRate)}%
            </p>
            <p className="mt-1 text-xs text-[#A9A9A9]">
              {formatTranslation(t.valueBetsHistory.hitRateDetail, {
                hits: stats.hits,
                resolved: stats.resolved,
              })}
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-6 space-y-3">
        {entries.map((entry) => (
          <article
            key={entry.id}
            className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 sm:px-5 sm:py-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate font-semibold text-white">
                  {entry.match_label}
                </p>
                <p className="mt-1 text-sm text-[#CFCFCF]">
                  {localizeMarketLabel(entry.market, language)}
                </p>
                {entry.safety_tier ? (
                  <div className="mt-2">
                    <ValueStars tier={entry.safety_tier} size="sm" />
                  </div>
                ) : null}
              </div>

              <div className="flex shrink-0 items-center gap-4">
                {entry.probability ? (
                  <p className="text-sm text-[#777]">
                    {entry.probability}%
                  </p>
                ) : null}
                <span
                  className={`text-sm font-bold uppercase tracking-[0.12em] ${outcomeClass(entry.outcome)}`}
                >
                  {outcomeLabel(entry.outcome, t)}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>

      <Link
        href="/premium"
        className="mt-6 inline-flex text-sm font-bold text-[#72d5ff] transition hover:text-[#9de5ff]"
      >
        {t.valueBetsHistory.cta} →
      </Link>
    </section>
  );
}
