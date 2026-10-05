"use client";

import { useLanguage } from "@/components/LanguageProvider";
import {
  type WorthBetting,
  worthBettingStyles,
} from "@/lib/worthBetting";

type WorthBettingFigure = {
  label: string;
  value: string;
};

type WorthBettingBlockProps = {
  worthBetting: WorthBetting;
  className?: string;
  compact?: boolean;
  figures?: WorthBettingFigure[];
};

const titleGradient =
  "bg-gradient-to-r from-[#18ff6d] via-[#E8DCC8] to-[#2fbfff] bg-clip-text text-transparent";

export default function WorthBettingBlock({
  worthBetting,
  className = "",
  compact = false,
  figures = [],
}: WorthBettingBlockProps) {
  const { t } = useLanguage();
  const styles = worthBettingStyles(worthBetting.verdict);
  const verdictLabel = t.worthBetting.verdicts[worthBetting.verdict];

  return (
    <section
      className={`relative overflow-hidden rounded-2xl border ${compact ? "p-5" : "rounded-[2rem] p-7 sm:p-8"} ${styles.border} ${styles.bg} ${className}`}
    >
      <div
        className={`pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full blur-[90px] ${styles.glow}`}
      />

      <div className="relative">
        <p className={`text-xs uppercase tracking-[0.25em] ${titleGradient} sm:text-sm`}>
          {t.worthBetting.subtitle}
        </p>

        <div className={`${compact ? "mt-3" : "mt-4"} flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between`}>
          <h3 className={`font-black text-white ${compact ? "text-xl" : "text-2xl sm:text-3xl"}`}>
            {t.worthBetting.title}
          </h3>

          <span
            className={`inline-flex shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold sm:px-4 sm:py-2 sm:text-sm ${styles.badge}`}
          >
            {verdictLabel}
          </span>
        </div>

        <p className={`mt-3 font-bold leading-7 text-white ${compact ? "text-lg" : "text-xl sm:text-2xl sm:leading-8"}`}>
          {worthBetting.headline}
        </p>

        {figures.length > 0 ? (
          <div className={`${compact ? "mt-4" : "mt-5"} grid grid-cols-2 gap-2`}>
            {figures.slice(0, 2).map((figure) => (
              <div key={figure.label} className="rounded-xl bg-black/30 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wide text-[#A9A9A9]">
                  {figure.label}
                </p>
                <p className="mt-1 text-lg font-black text-white">{figure.value}</p>
              </div>
            ))}
          </div>
        ) : null}

        <p className={`${compact ? "mt-3 text-sm leading-6" : "mt-4 leading-8"} text-[#D8D8D8]`}>
          {worthBetting.reason}
        </p>

        <p className={`${compact ? "mt-3" : "mt-5"} text-xs text-[#777] sm:text-sm`}>
          {t.worthBetting.disclaimer}
        </p>
      </div>
    </section>
  );
}
