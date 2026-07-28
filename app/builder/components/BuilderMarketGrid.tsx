"use client";

import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { formatTranslation } from "@/lib/locale";
import {
  getMarketShortLabel,
  getMatchResultMarkets,
  groupMarkets,
  isMatchResultMarket,
  isPlayerMarketLabel,
  splitPopularMarkets,
  type MarketGroupId,
} from "@/lib/builderMarkets";
import type { MappedFixture } from "@/lib/footballFixtures";

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
  fixture?: MappedFixture | null;
};

const groupOrder: MarketGroupId[] = [
  "result",
  "goals",
  "corners",
  "cards",
  "players",
];

function OddsButton({
  label,
  primaryLabel,
  selected,
  isResultMarket,
  onClick,
}: {
  label: string;
  primaryLabel: string;
  selected: boolean;
  isResultMarket: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-pressed={selected}
      className={`brain-odds-btn ${selected ? "brain-odds-btn-selected" : ""}`}
    >
      {selected ? (
        <span className="brain-odds-check" aria-hidden="true">
          ✓
        </span>
      ) : null}

      <span
        className={
          isResultMarket ? "brain-odds-btn-result" : "brain-odds-btn-text"
        }
      >
        {primaryLabel}
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
  fixture = null,
}: BuilderMarketGridProps) {
  const { t } = useLanguage();
  const [showAllMarkets, setShowAllMarkets] = useState(false);
  const grouped = groupMarkets(markets);
  const { popular, other } = splitPopularMarkets(markets);
  const resultMarkets = getMatchResultMarkets(markets);

  const groupLabels: Record<MarketGroupId, string> = {
    result: t.builder.marketGroups.result,
    goals: t.builder.marketGroups.goals,
    corners: t.builder.marketGroups.corners,
    cards: t.builder.marketGroups.cards,
    players: t.builder.marketGroups.players,
  };

  function isMarketSelected(marketOption: string) {
    const isPlayerRow = isPlayerMarketLabel(marketOption);
    const inSlip = isMarketInSlip?.(marketOption) ?? false;
    const draftCount = playerDraftCountForMarket?.(marketOption) ?? 0;

    if (isPlayerRow) {
      return (
        activePlayerMarket === marketOption ||
        draftCount > 0 ||
        inSlip
      );
    }

    return inSlip || selectedMarkets.includes(marketOption);
  }

  function handleMarketClick(marketOption: string) {
    if (isPlayerMarketLabel(marketOption)) {
      onSelectPlayerMarket?.(marketOption);
      return;
    }

    onToggleMarket(marketOption);
  }

  function renderOddsButton(marketOption: string) {
    const selected = isMarketSelected(marketOption);
    const displayLabel =
      getMarketDisplayLabel?.(marketOption) ?? marketOption;
    const shortLabel = isMatchResultMarket(marketOption)
      ? getMarketShortLabel(marketOption, fixture ?? undefined)
      : getMarketShortLabel(displayLabel, fixture ?? undefined);

    return (
      <OddsButton
        key={marketOption}
        label={displayLabel}
        primaryLabel={
          isMatchResultMarket(marketOption) ? shortLabel : displayLabel
        }
        selected={selected}
        isResultMarket={isMatchResultMarket(marketOption)}
        onClick={() => handleMarketClick(marketOption)}
      />
    );
  }

  function renderMarketGroup(groupId: MarketGroupId, items: string[]) {
    if (items.length === 0) {
      return null;
    }

    const resultItems = items.filter(isMatchResultMarket);
    const nonResultItems = items.filter((item) => !isMatchResultMarket(item));

    return (
      <section key={groupId}>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#777]">
          {groupLabels[groupId]}
        </p>

        {resultItems.length >= 2 ? (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {resultItems.map(renderOddsButton)}
          </div>
        ) : null}

        {nonResultItems.length > 0 ? (
          <div
            className={`grid gap-2 ${
              resultItems.length >= 2 ? "mt-2" : "mt-3"
            } grid-cols-2 sm:grid-cols-3`}
          >
            {nonResultItems.map(renderOddsButton)}
          </div>
        ) : null}
      </section>
    );
  }

  if (simpleMode && !showAllMarkets && popular.length > 0) {
    const hiddenSelectedCount = other.filter((market) =>
      isMarketSelected(market)
    ).length;
    const popularResults = popular.filter(isMatchResultMarket);
    const popularOther = popular.filter((market) => !isMatchResultMarket(market));

    return (
      <div className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#777]">
          {t.builder.popularMarketsTitle}
        </p>

        {popularResults.length >= 2 ? (
          <div className="grid grid-cols-3 gap-2">
            {popularResults.map(renderOddsButton)}
          </div>
        ) : null}

        {popularOther.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {popularOther.map(renderOddsButton)}
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setShowAllMarkets(true)}
          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-semibold text-[#E8DCC8] transition hover:border-[#18ff6d44]"
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
      {simpleMode &&
      showAllMarkets &&
      resultMarkets.length >= 2 &&
      !popular.some(isMatchResultMarket) ? (
        <section>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#777]">
            {t.builder.marketGroups.result}
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {resultMarkets.map(renderOddsButton)}
          </div>
        </section>
      ) : null}

      {simpleMode && showAllMarkets ? (
        <button
          type="button"
          onClick={() => setShowAllMarkets(false)}
          className="w-full rounded-xl border border-[#18ff6d33] bg-[#18ff6d]/10 px-4 py-2.5 text-sm font-semibold text-[#18ff6d]"
        >
          {t.builder.showFewerMarkets}
        </button>
      ) : null}

      {groupOrder.map((groupId) => {
        const items = grouped[groupId];

        if (groupId === "result" && simpleMode && !showAllMarkets) {
          return null;
        }

        return renderMarketGroup(groupId, items);
      })}
    </div>
  );
}
