"use client";

import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { formatTranslation } from "@/lib/locale";
import {
  getMarketIcon,
  groupMarkets,
  isPlayerMarketLabel,
  splitPopularMarkets,
  type MarketGroupId,
} from "@/lib/builderMarkets";

type BuilderMarketGridProps = {
  markets: readonly string[];
  selectedMarkets: readonly string[];
  onToggleMarket: (market: string) => void;
  activePlayerMarket?: string | null;
  onSelectPlayerMarket?: (market: string) => void;
  playerDraftCountForMarket?: (market: string) => number;
  isMarketInSlip?: (market: string) => boolean;
  getMarketDisplayLabel?: (market: string) => string;
  simpleMode?: boolean;
};

const groupOrder: MarketGroupId[] = [
  "result",
  "goals",
  "corners",
  "cards",
  "players",
];

function MarketButton({
  marketOption,
  selected,
  inSlip,
  displayLabel,
  badgeLabel,
  onClick,
}: {
  marketOption: string;
  selected: boolean;
  inSlip: boolean;
  displayLabel: string;
  badgeLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left transition ${
        selected
          ? "border-[#18ff6d] bg-[#18ff6d]/10"
          : "border-white/8 bg-black/30 hover:border-[#18ff6d]/40"
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs font-black ${
            selected
              ? "border-[#18ff6d] bg-[#18ff6d] text-black"
              : "border-white/20 bg-black/40 text-transparent"
          }`}
        >
          ✓
        </span>
        <span className="text-lg">{getMarketIcon(marketOption)}</span>
        <span
          className={`truncate text-sm font-semibold sm:text-base ${
            selected ? "text-white" : "text-[#E8E8E8]"
          }`}
        >
          {displayLabel}
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
        {badgeLabel}
      </span>
    </button>
  );
}

export default function BuilderMarketGrid({
  markets,
  selectedMarkets,
  onToggleMarket,
  activePlayerMarket = null,
  onSelectPlayerMarket,
  playerDraftCountForMarket,
  isMarketInSlip,
  getMarketDisplayLabel,
  simpleMode = false,
}: BuilderMarketGridProps) {
  const { t } = useLanguage();
  const [showAllMarkets, setShowAllMarkets] = useState(false);
  const grouped = groupMarkets(markets);
  const { popular, other } = splitPopularMarkets(markets);

  const groupLabels: Record<MarketGroupId, string> = {
    result: t.builder.marketGroups.result,
    goals: t.builder.marketGroups.goals,
    corners: t.builder.marketGroups.corners,
    cards: t.builder.marketGroups.cards,
    players: t.builder.marketGroups.players,
  };

  function renderMarketRow(marketOption: string) {
    const isPlayerRow = isPlayerMarketLabel(marketOption);
    const inSlip = isMarketInSlip?.(marketOption) ?? false;
    const draftCount = playerDraftCountForMarket?.(marketOption) ?? 0;
    const selected = isPlayerRow
      ? activePlayerMarket === marketOption || draftCount > 0
      : inSlip || selectedMarkets.includes(marketOption);
    const displayLabel = getMarketDisplayLabel?.(marketOption) ?? marketOption;

    const badgeLabel = inSlip
      ? t.fixtureCard.inSlipBadge
      : isPlayerRow
        ? draftCount > 0
          ? formatTranslation(t.builder.playerDraftCount, {
              count: draftCount,
            })
          : activePlayerMarket === marketOption
            ? t.builder.configurePlayer
            : t.fixtureCard.select
        : selectedMarkets.includes(marketOption)
          ? t.builder.marketSelected
          : t.fixtureCard.select;

    return (
      <MarketButton
        key={marketOption}
        marketOption={marketOption}
        selected={selected}
        inSlip={inSlip}
        displayLabel={displayLabel}
        badgeLabel={badgeLabel}
        onClick={() =>
          isPlayerRow
            ? onSelectPlayerMarket?.(marketOption)
            : onToggleMarket(marketOption)
        }
      />
    );
  }

  if (simpleMode && !showAllMarkets && popular.length > 0) {
    const hiddenSelectedCount = other.filter(
      (market) =>
        selectedMarkets.includes(market) ||
        isMarketInSlip?.(market) ||
        (isPlayerMarketLabel(market) &&
          (activePlayerMarket === market ||
            (playerDraftCountForMarket?.(market) ?? 0) > 0))
    ).length;

    return (
      <div className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#777]">
          {t.builder.popularMarketsTitle}
        </p>

        <div className="space-y-2">{popular.map(renderMarketRow)}</div>

        <button
          type="button"
          onClick={() => setShowAllMarkets(true)}
          className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-semibold text-[#E8DCC8] transition hover:border-[#18ff6d44]"
        >
          {formatTranslation(t.builder.showMoreMarkets, {
            count: other.length,
          })}
          {hiddenSelectedCount > 0
            ? ` · ${formatTranslation(t.builder.hiddenSelectedMarkets, {
                count: hiddenSelectedCount,
              })}`
            : ""}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {simpleMode && showAllMarkets ? (
        <button
          type="button"
          onClick={() => setShowAllMarkets(false)}
          className="w-full rounded-2xl border border-[#18ff6d33] bg-[#18ff6d]/10 px-4 py-2.5 text-sm font-semibold text-[#18ff6d]"
        >
          {t.builder.showFewerMarkets}
        </button>
      ) : null}

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
              {items.map(renderMarketRow)}
            </div>
          </section>
        );
      })}
    </div>
  );
}
