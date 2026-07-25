"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { formatTranslation } from "@/lib/locale";
import { localizeMarketLabel } from "@/lib/marketOdds";

const LOG_SLOTS = 8;

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

  const loadHistory = useCallback(async () => {
    try {
      const response = await fetch(`/api/value-bets/history?limit=${LOG_SLOTS}`, {
        cache: "no-store",
      });
      const data = await response.json();

      if (!Array.isArray(data?.entries)) {
        return;
      }

      setEntries(mapEntries(data.entries).slice(0, LOG_SLOTS));
      setStats(data.stats || null);
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
      className="mt-6 w-full max-w-3xl rounded-[2rem] border border-white/10 bg-black/30 p-5 text-left sm:p-6"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#18ff6d]">
            💎 {t.valueBetsHistory.title}
          </p>
          <p className="mt-2 text-xs leading-5 text-[#777]">{t.valueBetsHistory.publicNote}</p>
        </div>

        {stats && stats.hitRate !== null && stats.resolved > 0 ? (
          <div className="text-right text-xs text-[#A9A9A9]">
            <p>
              <span className="font-bold text-[#18ff6d]">{Math.round(stats.hitRate)}%</span>
              {" · "}
              {formatTranslation(t.valueBetsHistory.hitRateDetail, {
                hits: stats.hits,
                resolved: stats.resolved,
              })}
            </p>
          </div>
        ) : null}
      </div>

      {entries.length === 0 ? (
        <p className="mt-4 text-sm leading-6 text-[#A9A9A9]">{t.valueBetsHistory.emptySidebar}</p>
      ) : (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-[#18ff6d22] bg-[#121212]/60 px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[#E8E8E8]">{entry.match_label}</p>
                <p className="truncate text-xs text-[#777]">
                  {localizeMarketLabel(entry.market, language)}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${outcomeClass(entry.outcome)}`}
              >
                {outcomeLabel(entry.outcome, t)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/8 pt-3">
        <p className="text-[11px] text-[#555]">{t.valueBetsHistory.updated}</p>
        <Link
          href="/premium"
          className="text-xs font-bold text-[#18ff6d] transition hover:underline"
        >
          {t.valueBetsHistory.cta} →
        </Link>
      </div>
    </section>
  );
}
