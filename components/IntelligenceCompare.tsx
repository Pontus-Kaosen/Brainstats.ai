"use client";

import { useLanguage } from "@/components/LanguageProvider";

export default function IntelligenceCompare() {
  const { t } = useLanguage();
  const compare = t.intelligenceCompare;

  return (
    <section className="mt-6 rounded-[2rem] border border-white/10 bg-black/35 p-4 sm:mt-8 sm:p-6">
      <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#A9A9A9]">
        {compare.subtitle}
      </p>
      <h2 className="mt-2 text-xl font-black text-white sm:text-2xl">
        {compare.title}
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-[#A9A9A9]">
        {compare.intro}
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <article className="rounded-3xl border border-[#18ff6d33] bg-[#18ff6d]/5 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-2xl" aria-hidden>
                🎯
              </p>
              <h3 className="mt-2 text-lg font-black text-white">
                {compare.aiTips.label}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#CFCFCF]">
                {compare.aiTips.tagline}
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-[#18ff6d33] bg-black/30 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#18ff6d]">
              {compare.aiTips.plan}
            </span>
          </div>

          <ul className="mt-4 space-y-2 text-sm text-[#A9A9A9]">
            {compare.aiTips.bullets.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-[#18ff6d]" aria-hidden>
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <a
            href="#ai-tips"
            className="mt-5 inline-flex text-sm font-bold text-[#18ff6d] transition hover:text-[#7dffb0]"
          >
            {compare.aiTips.cta} →
          </a>
        </article>

        <article className="rounded-3xl border border-[#72d5ff33] bg-[#2fbfff]/5 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-2xl" aria-hidden>
                💎
              </p>
              <h3 className="mt-2 text-lg font-black text-white">
                {compare.valueBets.label}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#CFCFCF]">
                {compare.valueBets.tagline}
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-[#72d5ff33] bg-black/30 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#72d5ff]">
              {compare.valueBets.plan}
            </span>
          </div>

          <ul className="mt-4 space-y-2 text-sm text-[#A9A9A9]">
            {compare.valueBets.bullets.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-[#72d5ff]" aria-hidden>
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <a
            href="#value-bets"
            className="mt-5 inline-flex text-sm font-bold text-[#72d5ff] transition hover:text-[#9de5ff]"
          >
            {compare.valueBets.cta} →
          </a>
        </article>
      </div>
    </section>
  );
}
