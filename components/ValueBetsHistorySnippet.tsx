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
  if (outcome === "won") return t.valueBetsHistory.wonShort;
  if (outcome === "lost") return t.valueBetsHistory.lostShort;
  if (outcome === "void") return t.valueBetsHistory.voidShort;
  return t.valueBetsHistory.pendingShort;
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
      const response = await fetch(`/api/value-bets/history?limit=${LOG_SLOTS}`, {
        cache: "no-store",
      });
      const data = await response.json();

      if (!Array.isArray(data?.entries)) {
        return;
      }

      setEntries(mapEntries(data.entries).slice(0, LOG_SLOTS));
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

  const slots = Array.from({ length: LOG_SLOTS }, (_, index) => entries[index] ?? null);

  return (
    <>
      <aside
        className="fixed left-0 top-[4.5rem] z-30 hidden h-[calc(100dvh-4.5rem)] w-48 flex-col border-r border-[#18ff6d55] bg-[#080808]/96 px-3 py-3 shadow-[4px_0_24px_rgba(0,0,0,0.45)] backdrop-blur-md sm:top-20 sm:h-[calc(100dvh-5rem)] md:flex"
        aria-live="polite"
      >
        <div className="shrink-0 border-b border-white/8 pb-2">
          <div className="flex items-center gap-1">
            <span aria-hidden className="text-xs">
              💎
            </span>
            <h2 className="text-[10px] font-black uppercase leading-tight tracking-[0.12em] text-[#18ff6d]">
              {t.valueBetsHistory.title}
            </h2>
          </div>

          {stats && stats.hitRate !== null && stats.resolved > 0 ? (
            <p className="mt-1 text-[9px] leading-snug text-[#A9A9A9]">
              {Math.round(stats.hitRate)}% ·{" "}
              {formatTranslation(t.valueBetsHistory.hitRateDetail, {
                hits: stats.hits,
                resolved: stats.resolved,
              })}
            </p>
          ) : null}

          <p className="mt-0.5 text-[9px] leading-snug text-[#666]">
            {t.valueBetsHistory.hitRateTarget}
            {lastUpdated ? ` · ${t.valueBetsHistory.updated}` : null}
          </p>
        </div>

        <ol className="mt-2 flex min-h-0 flex-1 flex-col">
          {slots.map((entry, index) => (
            <li
              key={entry?.id || `slot-${index}`}
              className="flex min-h-0 flex-1 flex-col justify-center border-b border-white/6 py-1 last:border-b-0"
            >
              {entry ? (
                <>
                  <p className="line-clamp-2 text-[10px] font-medium leading-[1.25] text-[#E8E8E8]">
                    {entry.match_label}
                  </p>
                  <div className="mt-0.5 flex items-center justify-between gap-1">
                    <p className="min-w-0 truncate text-[9px] leading-4 text-[#777]">
                      {localizeMarketLabel(entry.market, language)}
                    </p>
                    <span
                      className={`shrink-0 rounded-full border px-1.5 py-px text-[8px] font-bold uppercase tracking-[0.06em] ${outcomeClass(entry.outcome)}`}
                    >
                      {outcomeLabel(entry.outcome, t)}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-[9px] leading-4 text-[#444]">—</p>
              )}
            </li>
          ))}
        </ol>

        <Link
          href="/premium"
          className="mt-2 shrink-0 text-[9px] font-bold leading-4 text-[#72d5ff] transition hover:text-[#9de5ff]"
        >
          {t.valueBetsHistory.ctaShort} →
        </Link>
      </aside>

      <section
        className="mx-4 mt-3 rounded-xl border border-[#18ff6d22] bg-black/55 px-3 py-3 md:hidden"
        aria-live="polite"
      >
        <div className="flex items-center justify-between gap-2 border-b border-white/8 pb-2">
          <h2 className="text-[11px] font-black uppercase tracking-[0.12em] text-[#18ff6d]">
            💎 {t.valueBetsHistory.title}
          </h2>
          <p className="text-[10px] text-[#666]">{t.valueBetsHistory.hitRateTarget}</p>
        </div>

        {entries.length === 0 ? (
          <p className="mt-2 text-[11px] text-[#888]">{t.valueBetsHistory.emptySidebar}</p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {entries.slice(0, 4).map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-2 text-[11px]">
                <span className="min-w-0 truncate text-[#E8E8E8]">{entry.match_label}</span>
                <span
                  className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[8px] font-bold uppercase ${outcomeClass(entry.outcome)}`}
                >
                  {outcomeLabel(entry.outcome, t)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
