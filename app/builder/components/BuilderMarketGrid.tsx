"use client";

import { useLanguage } from "@/components/LanguageProvider";
import {
  getMarketIcon,
  groupMarkets,
  type MarketGroupId,
} from "@/lib/builderMarkets";

type BuilderMarketGridProps = {
  markets: readonly string[];
  selectedMarket: string;
  onSelectMarket: (market: string) => void;
  isMarketInSlip?: (market: string) => boolean;
};

const groupOrder: MarketGroupId[] = [
  "result",
  "goals",
  "corners",
  "cards",
  "players",
];

export default function BuilderMarketGrid({
  markets,
  selectedMarket,
  onSelectMarket,
  isMarketInSlip,
}: BuilderMarketGridProps) {
  const { t } = useLanguage();
  const grouped = groupMarkets(markets);

  const groupLabels: Record<MarketGroupId, string> = {
    result: t.builder.marketGroups.result,
    goals: t.builder.marketGroups.goals,
    corners: t.builder.marketGroups.corners,
    cards: t.builder.marketGroups.cards,
    players: t.builder.marketGroups.players,
  };

  return (
    <div className="space-y-5">
      {groupOrder.map((groupId) => {
        const items = grouped[groupId];

        if (items.length === 0) {
          return null;
        }

        return (
          <section key={groupId}>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#777]">
              {groupLabels[groupId]}
            </p>

            <div className="mt-3 space-y-2">
              {items.map((marketOption) => {
                const selected = selectedMarket === marketOption;
                const inSlip = isMarketInSlip?.(marketOption) ?? false;

                return (
                  <button
                    key={marketOption}
                    type="button"
                    onClick={() => onSelectMarket(marketOption)}
                    className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left transition ${
                      selected
                        ? "border-[#18ff6d] bg-[#18ff6d]/10"
                        : "border-white/8 bg-black/30 hover:border-[#18ff6d]/40"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="text-lg">{getMarketIcon(marketOption)}</span>
                      <span
                        className={`truncate text-sm font-semibold sm:text-base ${
                          selected ? "text-white" : "text-[#E8E8E8]"
                        }`}
                      >
                        {marketOption}
                      </span>
                    </div>

                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                        inSlip
                          ? "border-[#18ff6d] bg-[#18ff6d]/20 text-[#18ff6d]"
                          : selected
                            ? "border-[#18ff6d]/40 bg-[#18ff6d]/10 text-[#18ff6d]"
                            : "border-white/10 bg-black/40 text-[#777]"
                      }`}
                    >
                      {inSlip
                        ? t.fixtureCard.inSlipBadge
                        : selected
                          ? t.builder.buildPickCta
                          : t.fixtureCard.select}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
