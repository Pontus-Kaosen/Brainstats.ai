"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { formatTranslation } from "@/lib/locale";
import { localizeMarketLabel } from "@/lib/marketOdds";

type ValueBetHistoryEntry = {
  id: string;
  match_label: string;
  market: string;
  outcome: "pending" | "won" | "lost" | "void";
};

type ValueBetHistoryStats = {
  resolved: number;
  hits: number;
  hitRate: number | null;
  pending: number;
};

type ValueBetsHistorySnippetProps = {
  initialEntries?: ValueBetHistoryEntry[];
  initialStats?: ValueBetHistoryStats | null;
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
  if (outcome === "won") {
    return "border-[#18ff6d33] bg-[#18ff6d]/10 text-[#18ff6d]";
  }

  if (outcome === "lost") {
    return "border-red-500/30 bg-red-500/10 text-red-300";
  }

  if (outcome === "pending") {
    return "border-[#E8DCC8]/20 bg-[#E8DCC8]/5 text-[#E8DCC8]";
  }

  return "border-white/10 bg-black/20 text-[#A9A9A9]";
}

function normalizeOutcome(value: unknown): ValueBetHistoryEntry["outcome"] {
  if (value === "won" || value === "lost" || value === "void" || value === "pending") {
    return value;
  }

  return "pending";
}

function mapEntries(raw: unknown[]): ValueBetHistoryEntry[] {
  return raw
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item) => ({
      id: String(item.id || ""),
      match_label: String(item.match_label || ""),
      market: String(item.market || ""),
      outcome: normalizeOutcome(item.outcome),
    }))
    .filter((item) => item.id && item.match_label);
}

export default function ValueBetsHistorySnippet({
  initialEntries = [],
  initialStats = null,
}: ValueBetsHistorySnippetProps) {
  const { t, language } = useLanguage();
  const [entries, setEntries] = useState<ValueBetHistoryEntry[]>(initialEntries);
  const [stats, setStats] = useState<ValueBetHistoryStats | null>(initialStats);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      const response = await fetch("/api/value-bets/history?limit=8", {
        cache: "no-store",
      });
      const data = await response.json();

      if (!Array.isArray(data?.entries)) {
        return;
      }

      setEntries(mapEntries(data.entries).slice(0, 8));
      setStats(data.stats || null);
      setLastUpdated(new Date());
    } catch {
      // Keep last known data visible
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    const pendingCount = stats?.pending || 0;
    const intervalMs = pendingCount > 0 ? 45_000 : 180_000;

    const intervalId = window.setInterval(() => {
      void loadHistory();
    }, intervalMs);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void loadHistory();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadHistory, stats?.pending]);

  return (
    <section
      className="rounded-2xl border border-[#18ff6d22] bg-black/50 px-4 py-4 backdrop-blur-sm sm:rounded-[1.5rem] sm:px-5 sm:py-5"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span aria-hidden className="text-lg">
              💎
            </span>
            <h2 className="text-sm font-black uppercase tracking-[0.16em] text-[#18ff6d] sm:text-base">
              {t.valueBetsHistory.title}
            </h2>
          </div>
          <p className="mt-1 text-xs text-[#777]">{t.valueBetsHistory.publicNote}</p>
        </div>

        <div className="text-right">
          {stats && stats.hitRate !== null && stats.resolved > 0 ? (
            <p className="text-xs text-[#A9A9A9] sm:text-sm">
              {t.valueBetsHistory.hitRateLabel}:{" "}
              <span className="font-bold text-[#18ff6d]">
                {Math.round(stats.hitRate)}%
              </span>
              <span className="ml-2 text-[#777]">· {t.valueBetsHistory.hitRateTarget}</span>
              <span className="hidden sm:inline">
                {" "}
                (
                {formatTranslation(t.valueBetsHistory.hitRateDetail, {
                  hits: stats.hits,
                  resolved: stats.resolved,
                })}
                )
              </span>
            </p>
          ) : (
            <p className="text-xs text-[#777] sm:text-sm">
              {t.valueBetsHistory.hitRateTarget}
            </p>
          )}
          {lastUpdated ? (
            <p className="mt-1 text-[10px] text-[#555]">
              {t.valueBetsHistory.updated}
            </p>
          ) : null}
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="mt-4 text-sm leading-7 text-[#A9A9A9]">
          {t.valueBetsHistory.empty}
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-black/30 px-3 py-2.5 sm:px-4"
            >
              <p className="min-w-0 truncate text-sm text-[#E8E8E8]">
                {entry.match_label} ·{" "}
                {localizeMarketLabel(entry.market, language)}
              </p>
              <span
                className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${outcomeClass(entry.outcome)}`}
              >
                {outcomeLabel(entry.outcome, t)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/premium"
        className="mt-3 inline-flex text-xs font-bold text-[#72d5ff] transition hover:text-[#9de5ff] sm:text-sm"
      >
        {t.valueBetsHistory.cta} →
      </Link>
    </section>
  );
}
