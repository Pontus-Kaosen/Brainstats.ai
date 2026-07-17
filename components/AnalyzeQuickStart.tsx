"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

export default function AnalyzeQuickStart() {
  const { t } = useLanguage();

  const steps = [
    { n: "1", text: t.analyze.quickStartStep1 },
    { n: "2", text: t.analyze.quickStartStep2 },
    { n: "3", text: t.analyze.quickStartStep3 },
  ];

  return (
    <div className="mb-5 rounded-2xl border border-[#E8DCC8]/25 bg-gradient-to-r from-[#E8DCC8]/5 via-[#18ff6d]/5 to-transparent p-4 sm:p-5">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E8DCC8]">
        {t.analyze.quickStartBadge}
      </p>
      <h3 className="mt-2 text-lg font-black text-white">
        {t.analyze.quickStartTitle}
      </h3>
      <ol className="mt-4 space-y-2">
        {steps.map((step) => (
          <li
            key={step.n}
            className="flex items-start gap-3 text-sm leading-6 text-[#D8D8D8]"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#18ff6d]/15 text-xs font-black text-[#18ff6d]">
              {step.n}
            </span>
            {step.text}
          </li>
        ))}
      </ol>
      <Link
        href="/analyze?mode=image"
        className="mt-4 inline-flex rounded-xl bg-[#18ff6d] px-4 py-2.5 text-sm font-bold text-black transition hover:opacity-90"
      >
        {t.analyze.quickStartCta} →
      </Link>
    </div>
  );
}
