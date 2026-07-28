"use client";

import type { ReactNode } from "react";
import {
  getMatchResultDisplay,
  groupMarkets,
  isMatchResultMarket,
  isPlayerMarketLabel,
  splitOverUnderMarkets,
  type MarketGroupId,
} from "@/lib/builderMarkets";
import type { MappedFixture } from "@/lib/footballFixtures";
import { useLanguage } from "@/components/LanguageProvider";

type BuilderMarketGridProps = {
  markets: readonly string[];
  selectedMarkets: readonly string[];
  onToggleMarket: (market: string) => void;
  activePlayerMarket?: string | null;
  onSelectPlayerMarket?: (market: string) => void;
  playerDraftCountForMarket?: (market: string) => number;
  isMarketInSlip?: (market: string) => boolean;
  getMarketDisplayLabel?: (market: string) => string;
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
  title,
  selected,
  stacked = false,
  onClick,
}: {
  label: string;
  title: string;
  selected: boolean;
  stacked?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-pressed={selected}
      className={`brain-odds-btn ${stacked ? "brain-odds-btn-stacked" : ""} ${
        selected ? "brain-odds-btn-selected" : ""
      }`}
    >
      {selected ? (
        <span className="brain-odds-check" aria-hidden="true">
          ✓
        </span>
      ) : null}

      <span className={stacked ? "brain-odds-btn-team" : "brain-odds-btn-text"}>
        {title}
      </span>
    </button>
  );
}

function OverUnderRow({
  label,
  items,
  renderButton,
}: {
  label: string;
  items: string[];
  renderButton: (market: string) => ReactNode;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold uppercase tracking-wide text-[#8a968f]">
        {label}
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(renderButton)}
      </div>
    </div>
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
  fixture = null,
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

  const resultLabels = {
    draw: t.builder.resultDraw,
    homeWin: t.builder.resultHomeWin,
    awayWin: t.builder.resultAwayWin,
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

  function renderStandardButton(marketOption: string) {
    const displayLabel =
      getMarketDisplayLabel?.(marketOption) ?? marketOption;

    return (
      <OddsButton
        key={marketOption}
        label={displayLabel}
        title={displayLabel}
        selected={isMarketSelected(marketOption)}
        onClick={() => handleMarketClick(marketOption)}
      />
    );
  }

  function renderResultButton(marketOption: string) {
    const displayLabel =
      getMarketDisplayLabel?.(marketOption) ?? marketOption;
    const resultDisplay =
      fixture && isMatchResultMarket(marketOption)
        ? getMatchResultDisplay(marketOption, fixture, resultLabels)
        : null;

    return (
      <OddsButton
        key={marketOption}
        label={displayLabel}
        title={resultDisplay?.title ?? displayLabel}
        selected={isMarketSelected(marketOption)}
        stacked
        onClick={() => handleMarketClick(marketOption)}
      />
    );
  }

  function sortResultMarkets(items: string[]) {
    const order = (market: string) => {
      const normalized = market.trim().toLowerCase();
      if (/^hemmalag vinner$|^home win$/i.test(normalized)) return 0;
      if (/^oavgjort$|^draw$/i.test(normalized)) return 1;
      if (/^bortalag vinner$|^away win$/i.test(normalized)) return 2;
      return 3;
    };

    return [...items].sort((a, b) => order(a) - order(b));
  }

  function renderOverUnderSection(items: string[]) {
    const { over, under, other } = splitOverUnderMarkets(items);

    return (
      <div className="mt-3 space-y-4">
        <OverUnderRow
          label={t.builder.overUnderOver}
          items={over}
          renderButton={renderStandardButton}
        />
        <OverUnderRow
          label={t.builder.overUnderUnder}
          items={under}
          renderButton={renderStandardButton}
        />
        {other.length > 0 ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {other.map(renderStandardButton)}
          </div>
        ) : null}
      </div>
    );
  }

  function renderMarketGroup(groupId: MarketGroupId, items: string[]) {
    if (items.length === 0) {
      return null;
    }

    const resultItems = sortResultMarkets(items.filter(isMatchResultMarket));
    const otherItems = items.filter((item) => !isMatchResultMarket(item));
    const usesOverUnderLayout =
      groupId === "goals" || groupId === "corners" || groupId === "cards";

    return (
      <section
        key={groupId}
        className="rounded-2xl border border-white/8 bg-black/25 p-4"
      >
        <h3 className="text-sm font-black text-[#18ff6d]">
          {groupLabels[groupId]}
        </h3>

        {resultItems.length > 0 ? (
          <div className="mt-3 grid grid-cols-1 gap-2 lg:grid-cols-3">
            {resultItems.map(renderResultButton)}
          </div>
        ) : null}

        {otherItems.length > 0 ? (
          usesOverUnderLayout ? (
            renderOverUnderSection(otherItems)
          ) : (
            <div
              className={`grid grid-cols-1 gap-2 sm:grid-cols-2 ${
                resultItems.length > 0 ? "mt-3" : "mt-3"
              }`}
            >
              {otherItems.map(renderStandardButton)}
            </div>
          )
        ) : null}
      </section>
    );
  }

  return (
    <div className="space-y-4">
      {groupOrder.map((groupId) => renderMarketGroup(groupId, grouped[groupId]))}
    </div>
  );
}
