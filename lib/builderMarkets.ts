export type MarketGroupId =
  | "result"
  | "goals"
  | "corners"
  | "cards"
  | "players";

export function isPlayerMarketLabel(market: string) {
  return (
    market.startsWith("Spelare") ||
    market.startsWith("Player") ||
    market.includes("målskytt") ||
    market.toLowerCase().includes("scorer")
  );
}

export function isCornerMarketLabel(market: string) {
  return market.includes("hörnor") || market.toLowerCase().includes("corner");
}

export function isCornerOverUnderMarketLabel(market: string) {
  const normalized = market.trim().toLowerCase();

  return (
    normalized === "över hörnor" ||
    normalized === "under hörnor" ||
    normalized === "over corners" ||
    normalized === "under corners"
  );
}

export function isCardMarketLabel(market: string) {
  return (
    market.toLowerCase().includes("card") ||
    market.includes("kort")
  );
}

export function isCardOverUnderMarketLabel(market: string) {
  const normalized = market.trim().toLowerCase();

  return (
    normalized === "över gula kort" ||
    normalized === "under gula kort" ||
    normalized === "over yellow cards" ||
    normalized === "under yellow cards"
  );
}

export const CORNER_LINE_OPTIONS = [
  "5.5",
  "6.5",
  "7.5",
  "8.5",
  "9.5",
  "10.5",
  "11.5",
  "12.5",
] as const;

export const CARD_LINE_OPTIONS = [
  "2.5",
  "3.5",
  "4.5",
  "5.5",
  "6.5",
] as const;

export function formatMarketWithLine(market: string, line: string) {
  const normalized = market.trim().toLowerCase();

  if (isCornerOverUnderMarketLabel(market)) {
    const isOver = normalized.startsWith("över") || normalized.startsWith("over");

    if (normalized.includes("hörnor")) {
      return `${isOver ? "Över" : "Under"} ${line} hörnor`;
    }

    return `${isOver ? "Over" : "Under"} ${line} corners`;
  }

  if (isCardOverUnderMarketLabel(market)) {
    const isOver = normalized.startsWith("över") || normalized.startsWith("over");

    if (normalized.includes("kort")) {
      return `${isOver ? "Över" : "Under"} ${line} gula kort`;
    }

    return `${isOver ? "Over" : "Under"} ${line} yellow cards`;
  }

  return market;
}

export function isGoalMarketLabel(market: string) {
  return (
    market.toLowerCase().includes("goal") ||
    market.includes("mål") ||
    market.toLowerCase().includes("over") ||
    market.toLowerCase().includes("under") ||
    market.includes("Över") ||
    market.includes("Under") ||
    market.includes("Båda")
  );
}

export function getMarketGroup(market: string): MarketGroupId {
  if (isPlayerMarketLabel(market)) return "players";
  if (isCornerMarketLabel(market)) return "corners";
  if (isCardMarketLabel(market)) return "cards";
  if (isGoalMarketLabel(market)) return "goals";
  return "result";
}

export function getMarketIcon(market: string) {
  if (isPlayerMarketLabel(market)) return "👤";
  if (isGoalMarketLabel(market)) return "⚽";
  if (isCornerMarketLabel(market)) return "🚩";
  if (isCardMarketLabel(market)) return "🟨";
  return "🎯";
}

export function groupMarkets(markets: readonly string[]) {
  const groups: Record<MarketGroupId, string[]> = {
    result: [],
    goals: [],
    corners: [],
    cards: [],
    players: [],
  };

  for (const market of markets) {
    groups[getMarketGroup(market)].push(market);
  }

  return groups;
}
