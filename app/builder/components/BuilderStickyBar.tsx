"use client";

import Button from "@/components/Button";
import { useLanguage } from "@/components/LanguageProvider";
import { formatTranslation } from "@/lib/locale";

type BuilderStickyBarProps = {
  slipCount: number;
  pendingCount: number;
  onAnalyzeSlip: () => void;
  onAnalyzeSelection: () => void;
};

export default function BuilderStickyBar({
  slipCount,
  pendingCount,
  onAnalyzeSlip,
  onAnalyzeSelection,
}: BuilderStickyBarProps) {
  const { t } = useLanguage();

  if (slipCount === 0 && pendingCount === 0) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#18ff6d33] bg-[#050505]/95 px-4 py-3 backdrop-blur-xl xl:hidden">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-[#A9A9A9] sm:text-sm">
          {slipCount > 0
            ? formatTranslation(t.builder.stickySlipReady, { count: slipCount })
            : formatTranslation(t.builder.stickySelectionReady, {
                count: pendingCount,
              })}
        </p>

        <div className="flex gap-2">
          {pendingCount > 0 ? (
            <Button
              variant="secondary"
              onClick={onAnalyzeSelection}
              className="flex-1 py-3 sm:flex-none"
            >
              {t.builder.analyzeDirect}
            </Button>
          ) : null}

          {slipCount > 0 ? (
            <Button onClick={onAnalyzeSlip} className="flex-1 py-3 sm:flex-none">
              {t.builder.analyze}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
