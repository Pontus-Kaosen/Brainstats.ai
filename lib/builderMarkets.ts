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

export function isCardMarketLabel(market: string) {
  return (
    market.toLowerCase().includes("card") ||
    market.includes("kort")
  );
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
