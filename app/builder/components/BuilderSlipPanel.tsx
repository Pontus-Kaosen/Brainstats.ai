"use client";

import Button from "@/components/Button";
import { useLanguage } from "@/components/LanguageProvider";
import { getLocale } from "@/lib/locale";

export type BuilderSlipItem = {
  fixtureId: number;
  homeTeam: string;
  awayTeam: string;
  market: string;
  date: string;
};

type BuilderSlipPanelProps = {
  slip: BuilderSlipItem[];
  onRemove: (index: number) => void;
  onClear: () => void;
  onAnalyze: () => void;
  compact?: boolean;
};

export default function BuilderSlipPanel({
  slip,
  onRemove,
  onClear,
  onAnalyze,
  compact = false,
}: BuilderSlipPanelProps) {
  const { t, language } = useLanguage();

  return (
    <div className={compact ? "rounded-2xl border border-[#18ff6d22] bg-black/40 p-4" : ""}>
      <h2
        className={
          compact
            ? "text-lg font-bold"
            : "text-2xl font-bold"
        }
      >
        {t.builder.brainSlipTitle}
        {compact && slip.length > 0 ? (
          <span className="ml-2 text-sm font-semibold text-[#18ff6d]">
            ({slip.length})
          </span>
        ) : null}
      </h2>

      <div
        className={`space-y-3 ${compact ? "mt-4 max-h-40 overflow-y-auto" : "mt-6"}`}
      >
        {slip.length === 0 ? (
          compact ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-3">
              <p className="text-sm text-[#A9A9A9]">
                {t.builder.noMatchSelected}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-[#777]">
                {t.builder.slipEmptyHint}
              </p>
            </div>
          ) : (
            <p className="text-sm text-[#A9A9A9]">
              {t.builder.noMatchSelected}
            </p>
          )
        ) : (
          <>
            {slip.map((item, index) => (
              <div
                key={`${item.fixtureId}-${item.market}-${index}`}
                className="flex items-start justify-between rounded-2xl border border-[#18ff6d11] bg-black/30 p-3 sm:p-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold sm:text-base">
                    {item.homeTeam} – {item.awayTeam}
                  </p>

                  <p className="mt-1 text-sm text-[#18ff6d]">
                    {item.market}
                  </p>

                  {!compact && (
                    <p className="mt-2 text-xs text-[#A9A9A9]">
                      {new Date(item.date).toLocaleString(
                        getLocale(language),
                        {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="ml-3 shrink-0 text-red-400 transition hover:text-red-300"
                  title={t.builder.removeTitle}
                >
                  ✕
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={onClear}
              className="w-full rounded-2xl border border-red-500/50 px-4 py-2.5 text-sm text-red-400 transition hover:bg-red-500 hover:text-white"
            >
              {t.builder.clearSlip}
            </button>
          </>
        )}
      </div>

      <Button
        disabled={slip.length === 0}
        onClick={onAnalyze}
        className={`w-full ${compact ? "mt-4 py-3" : "mt-8"}`}
      >
        {t.builder.analyze}
      </Button>
    </div>
  );
}
