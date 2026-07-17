"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import {
  dismissOnboarding,
  isOnboardingDismissed,
} from "@/lib/onboarding";

type OnboardingChecklistProps = {
  analysisCount: number;
};

export default function OnboardingChecklist({
  analysisCount,
}: OnboardingChecklistProps) {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!isOnboardingDismissed());
  }, []);

  if (!visible) return null;

  const steps = [
    {
      done: true,
      label: t.onboarding.stepAccount,
    },
    {
      done: analysisCount > 0,
      label: t.onboarding.stepAnalyze,
      href: "/analyze?mode=image",
    },
    {
      done: false,
      label: t.onboarding.stepAiTips,
      href: "/dashboard#ai-tips",
    },
    {
      done: false,
      label: t.onboarding.stepBuilder,
      href: "/builder",
    },
  ];

  const completed = steps.filter((s) => s.done).length;

  return (
    <section className="mt-6 overflow-hidden rounded-[2rem] border border-[#18ff6d33] bg-[#07140d]/80 p-5 sm:mt-8 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#18ff6d]">
            {t.onboarding.badge}
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">
            {t.onboarding.title}
          </h2>
          <p className="mt-2 text-sm leading-7 text-[#A9A9A9]">
            {t.onboarding.description}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            dismissOnboarding();
            setVisible(false);
          }}
          className="shrink-0 rounded-xl border border-white/10 px-3 py-2 text-xs text-[#888] transition hover:border-white/20 hover:text-white"
          aria-label={t.onboarding.dismiss}
        >
          ✕
        </button>
      </div>

      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#747474]">
        {completed}/{steps.length} {t.onboarding.completed}
      </p>

      <ul className="mt-4 space-y-3">
        {steps.map((step) => (
          <li key={step.label}>
            {step.href && !step.done ? (
              <Link
                href={step.href}
                className="flex items-center gap-3 rounded-2xl border border-[#18ff6d22] bg-black/30 px-4 py-3 transition hover:border-[#18ff6d55]"
              >
                <span className="text-[#18ff6d]">○</span>
                <span className="text-sm text-[#D8D8D8]">{step.label}</span>
                <span className="ml-auto text-[#18ff6d]">→</span>
              </Link>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <span className={step.done ? "text-[#18ff6d]" : "text-[#555]"}>
                  {step.done ? "✓" : "○"}
                </span>
                <span
                  className={`text-sm ${step.done ? "text-[#888] line-through" : "text-[#D8D8D8]"}`}
                >
                  {step.label}
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
