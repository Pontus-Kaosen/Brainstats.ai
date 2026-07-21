"use client";

import { useLanguage } from "@/components/LanguageProvider";
import {
  type WorthBetting,
  worthBettingStyles,
} from "@/lib/worthBetting";

type WorthBettingBlockProps = {
  worthBetting: WorthBetting;
  className?: string;
};

const titleGradient =
  "bg-gradient-to-r from-[#18ff6d] via-[#E8DCC8] to-[#2fbfff] bg-clip-text text-transparent";

export default function WorthBettingBlock({
  worthBetting,
  className = "",
}: WorthBettingBlockProps) {
  const { t } = useLanguage();
  const styles = worthBettingStyles(worthBetting.verdict);
  const verdictLabel = t.worthBetting.verdicts[worthBetting.verdict];

  return (
    <section
      className={`relative overflow-hidden rounded-[2rem] border p-7 sm:p-8 ${styles.border} ${styles.bg} ${className}`}
    >
      <div
        className={`pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full blur-[90px] ${styles.glow}`}
      />

      <div className="relative">
        <p className={`text-sm uppercase tracking-[0.25em] ${titleGradient}`}>
          {t.worthBetting.subtitle}
        </p>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <h3 className="text-2xl font-black text-white sm:text-3xl">
            {t.worthBetting.title}
          </h3>

          <span
            className={`inline-flex shrink-0 rounded-full border px-4 py-2 text-sm font-bold ${styles.badge}`}
          >
            {verdictLabel}
          </span>
        </div>

        <p className="mt-5 text-xl font-bold leading-8 text-white sm:text-2xl">
          {worthBetting.headline}
        </p>

        <p className="mt-4 leading-8 text-[#D8D8D8]">{worthBetting.reason}</p>

        <p className="mt-5 text-sm text-[#777]">{t.worthBetting.disclaimer}</p>
      </div>
    </section>
  );
}
