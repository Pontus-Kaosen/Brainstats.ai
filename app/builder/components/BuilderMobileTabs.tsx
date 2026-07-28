"use client";

import { useLanguage } from "@/components/LanguageProvider";

export type BuilderMobilePane = "matches" | "markets" | "slip";

type BuilderMobileTabsProps = {
  value: BuilderMobilePane;
  onChange: (value: BuilderMobilePane) => void;
  slipCount: number;
  marketsDisabled?: boolean;
};

export default function BuilderMobileTabs({
  value,
  onChange,
  slipCount,
  marketsDisabled = false,
}: BuilderMobileTabsProps) {
  const { t } = useLanguage();

  const tabs: Array<{
    id: BuilderMobilePane;
    label: string;
    count?: number;
    disabled?: boolean;
  }> = [
    { id: "matches", label: t.builder.mobileTabMatches },
    {
      id: "markets",
      label: t.builder.mobileTabMarkets,
      disabled: marketsDisabled,
    },
    {
      id: "slip",
      label: t.builder.mobileTabSlip,
      count: slipCount,
    },
  ];

  return (
    <div className="mb-4 flex gap-2 xl:hidden">
      {tabs.map((tab) => {
        const active = value === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-bold transition ${
              tab.disabled
                ? "cursor-not-allowed border-white/5 bg-black/20 text-[#555]"
                : active
                  ? "border-[#18ff6d] bg-[#18ff6d] text-black"
                  : "border-[#18ff6d33] bg-[#18ff6d]/10 text-[#18ff6d]"
            }`}
          >
            {tab.label}
            {typeof tab.count === "number" && tab.count > 0 ? (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                  active ? "bg-black/20 text-black" : "bg-[#18ff6d]/20"
                }`}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
