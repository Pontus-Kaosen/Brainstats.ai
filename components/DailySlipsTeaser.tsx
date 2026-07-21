"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

export default function DailySlipsTeaser() {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-[#E8DCC8]/20 bg-gradient-to-br from-[#18ff6d]/10 via-[#E8DCC8]/5 to-[#2fbfff]/10 p-5 sm:p-8">
      <div className="pointer-events-none absolute inset-0 backdrop-blur-[2px]" />

      <div className="relative">
        <p className="inline-flex rounded-full border border-[#E8DCC8]/25 bg-black/30 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-[#E8DCC8]">
          🎯 {t.dailySlipsTeaser.badge}
        </p>

        <h2 className="mt-4 text-2xl font-black text-white sm:text-3xl">
          {t.dailySlipsTeaser.title}
        </h2>

        <p className="mt-3 max-w-2xl text-sm leading-7 text-[#A9A9A9] sm:text-base">
          {t.dailySlipsTeaser.description}
        </p>

        <div className="mt-6 grid gap-4 opacity-70 blur-[1px] sm:grid-cols-2">
          {[1, 2].map((index) => (
            <div
              key={index}
              className="rounded-3xl border border-[#18ff6d22] bg-black/40 p-5"
            >
              <div className="h-4 w-24 rounded-full bg-[#18ff6d]/20" />
              <div className="mt-4 h-6 w-3/4 rounded-lg bg-white/10" />
              <div className="mt-3 h-4 w-full rounded-lg bg-white/5" />
              <div className="mt-2 h-4 w-5/6 rounded-lg bg-white/5" />
            </div>
          ))}
        </div>

        <div className="relative -mt-16 flex flex-col items-center gap-4 pt-8 text-center sm:-mt-20">
          <p className="max-w-md text-sm leading-7 text-[#D8D8D8]">
            {t.dailySlipsTeaser.lockText}
          </p>

          <Link
            href="/login?next=%2Fdashboard%23ai-tips"
            className="inline-flex rounded-full bg-[#18ff6d] px-6 py-3 text-sm font-bold text-black transition hover:opacity-90"
          >
            {t.dailySlipsTeaser.cta}
          </Link>

          <p className="text-xs text-[#777]">{t.dailySlips.disclaimer}</p>
        </div>
      </div>
    </section>
  );
}
