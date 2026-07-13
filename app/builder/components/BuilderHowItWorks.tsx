"use client";

import { useLanguage } from "@/components/LanguageProvider";

type BuilderHowItWorksProps = {
  filtersReady: boolean;
  slipCount: number;
};

type StepStatus = "done" | "active" | "pending";

function stepStyles(status: StepStatus) {
  if (status === "done") {
    return "border-[#18ff6d44] bg-[#18ff6d]/10 text-[#18ff6d]";
  }
  if (status === "active") {
    return "border-[#18ff6d] bg-[#18ff6d]/15 text-white ring-1 ring-[#18ff6d]/40";
  }
  return "border-white/10 bg-black/20 text-[#777]";
}

export default function BuilderHowItWorks({
  filtersReady,
  slipCount,
}: BuilderHowItWorksProps) {
  const { t } = useLanguage();

  const steps = [
    t.builder.steps.filters,
    t.builder.steps.match,
    t.builder.steps.slip,
    t.builder.steps.analyze,
  ];

  function getStatus(index: number): StepStatus {
    if (index === 0) return filtersReady ? "done" : "active";
    if (index === 1) {
      if (!filtersReady) return "pending";
      return slipCount === 0 ? "active" : "done";
    }
    if (index === 2) {
      if (!filtersReady) return "pending";
      return slipCount > 0 ? "done" : "pending";
    }
    return slipCount > 0 ? "active" : "pending";
  }

  return (
    <div className="mt-4 rounded-2xl border border-[#18ff6d22] bg-black/25 p-3 sm:mt-6 sm:p-4">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#18ff6d]">
        {t.builder.steps.title}
      </p>

      <ol className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {steps.map((label, index) => {
          const status = getStatus(index);

          return (
            <li
              key={label}
              className={`rounded-xl border px-2.5 py-2 transition sm:px-3 sm:py-2.5 ${stepStyles(status)}`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 sm:text-xs">
                {index + 1}
              </span>
              <p className="mt-0.5 text-[11px] font-semibold leading-snug sm:text-xs">
                {label}
              </p>
            </li>
          );
        })}
      </ol>

      {filtersReady && slipCount === 0 ? (
        <p className="mt-3 text-xs leading-relaxed text-[#A9A9A9] sm:text-sm">
          {t.builder.matchTapHint}
        </p>
      ) : null}

      {slipCount > 0 ? (
        <p className="mt-3 text-xs leading-relaxed text-[#18ff6d] sm:text-sm">
          {t.builder.slipReadyHint}
        </p>
      ) : null}
    </div>
  );
}
