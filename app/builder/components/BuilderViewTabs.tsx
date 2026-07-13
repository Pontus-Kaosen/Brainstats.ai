"use client";

import { useLanguage } from "@/components/LanguageProvider";

export type BuilderViewMode = "today" | "tomorrow" | "live" | "league";

type BuilderViewTabsProps = {
  value: BuilderViewMode;
  onChange: (value: BuilderViewMode) => void;
  liveCount: number;
  todayCount?: number;
};

export default function BuilderViewTabs({
  value,
  onChange,
  liveCount,
  todayCount,
}: BuilderViewTabsProps) {
  const { t } = useLanguage();

  const tabs: Array<{
    id: BuilderViewMode;
    label: string;
    count?: number;
    accent?: "live";
  }> = [
    {
      id: "today",
      label: t.builder.viewTabToday,
      count: todayCount,
    },
    {
      id: "tomorrow",
      label: t.builder.viewTabTomorrow,
    },
    {
      id: "live",
      label: t.builder.viewTabLive,
      count: liveCount,
      accent: "live",
    },
    {
      id: "league",
      label: t.builder.viewTabLeague,
    },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {tabs.map((tab) => {
        const active = value === tab.id;
        const isLive = tab.accent === "live";

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`shrink-0 rounded-2xl border px-4 py-3 text-sm font-bold transition sm:px-5 sm:py-3.5 sm:text-base ${
              active
                ? isLive
                  ? "border-red-500 bg-red-500 text-white"
                  : "border-[#18ff6d] bg-[#18ff6d] text-black"
                : isLive
                  ? "border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500 hover:text-white"
                  : "border-[#18ff6d44] bg-[#18ff6d]/10 text-[#18ff6d] hover:border-[#18ff6d]"
            }`}
          >
            {tab.label}
            {typeof tab.count === "number" ? ` (${tab.count})` : ""}
          </button>
        );
      })}
    </div>
  );
}
