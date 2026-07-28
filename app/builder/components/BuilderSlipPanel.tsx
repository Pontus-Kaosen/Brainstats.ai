"use client";

import Button from "@/components/Button";
import { useLanguage } from "@/components/LanguageProvider";
import { formatTranslation, getLocale } from "@/lib/locale";

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
    <div className={`brain-betslip ${compact ? "" : "h-full"}`}>
      <div className="brain-betslip-header flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-white sm:text-lg">
            {t.builder.brainSlipTitle}
          </h2>
          <p className="mt-0.5 text-xs text-[#8a9a92]">
            {slip.length === 0
              ? t.builder.slipEmptyHint
              : formatTranslation(t.builder.slipSelectionCount, {
                  count: slip.length,
                })}
          </p>
        </div>

        {slip.length > 0 ? (
          <span className="rounded-full bg-[#18ff6d] px-2.5 py-1 text-xs font-black text-black">
            {slip.length}
          </span>
        ) : null}
      </div>

      <div
        className={`space-y-2 p-3 ${compact ? "max-h-52 overflow-y-auto" : "min-h-[12rem] p-4"}`}
      >
        {slip.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-4 text-center">
            <p className="text-sm text-[#A9A9A9]">{t.builder.noMatchSelected}</p>
          </div>
        ) : (
          <>
            {slip.map((item, index) => (
              <div
                key={`${item.fixtureId}-${item.market}-${index}`}
                className="relative rounded-xl border border-white/8 bg-black/35 p-3"
              >
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="absolute right-2 top-2 rounded-md px-1.5 py-0.5 text-xs font-bold text-[#888] transition hover:bg-red-500/15 hover:text-red-300"
                  title={t.builder.removeTitle}
                  aria-label={t.builder.removeTitle}
                >
                  ×
                </button>

                <p className="pr-6 text-[11px] font-semibold uppercase tracking-wide text-[#777]">
                  {item.homeTeam} v {item.awayTeam}
                </p>

                <p className="mt-1 pr-4 text-sm font-bold leading-snug text-[#18ff6d]">
                  {item.market}
                </p>

                {!compact ? (
                  <p className="mt-1.5 text-[11px] text-[#777]">
                    {new Date(item.date).toLocaleString(getLocale(language), {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                ) : null}
              </div>
            ))}

            <button
              type="button"
              onClick={onClear}
              className="w-full rounded-xl border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/10"
            >
              {t.builder.clearSlip}
            </button>
          </>
        )}
      </div>

      <div className="border-t border-white/8 p-3 sm:p-4">
        <Button
          disabled={slip.length === 0}
          onClick={onAnalyze}
          className="w-full py-3.5"
        >
          {slip.length === 0
            ? t.builder.analyze
            : formatTranslation(t.builder.analyzeSlipCount, {
                count: slip.length,
              })}
        </Button>
      </div>
    </div>
  );
}
