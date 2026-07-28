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

const popularMarketMatchers = [
  /^hemmalag vinner$/i,
  /^bortalag vinner$/i,
  /^home win$/i,
  /^away win$/i,
  /^oavgjort$/i,
  /^draw$/i,
  /^över 2\.5 mål$/i,
  /^under 2\.5 mål$/i,
  /^over 2\.5 goals$/i,
  /^under 2\.5 goals$/i,
  /^båda lagen gör mål$/i,
  /^both teams to score$/i,
];

export function isPopularMarket(market: string) {
  const normalized = market.trim();
  return popularMarketMatchers.some((pattern) => pattern.test(normalized));
}

export function splitPopularMarkets(markets: readonly string[]) {
  const popular: string[] = [];
  const other: string[] = [];

  for (const market of markets) {
    if (isPopularMarket(market)) {
      popular.push(market);
    } else {
      other.push(market);
    }
  }

  return { popular, other };
}

const matchResultMatchers = [
  /^hemmalag vinner$/i,
  /^bortalag vinner$/i,
  /^home win$/i,
  /^away win$/i,
  /^oavgjort$/i,
  /^draw$/i,
];

export function isMatchResultMarket(market: string) {
  return matchResultMatchers.some((pattern) => pattern.test(market.trim()));
}

export function getMatchResultDisplay(
  market: string,
  fixture: {
    teams: { home: { name: string }; away: { name: string } };
  },
  labels: {
    draw: string;
    homeWin: string;
    awayWin: string;
  }
) {
  const normalized = market.trim();

  if (/^hemmalag vinner$/i.test(normalized) || /^home win$/i.test(normalized)) {
    return {
      title: labels.homeWin.replace("{team}", fixture.teams.home.name),
      marketLabel: normalized,
    };
  }

  if (/^bortalag vinner$/i.test(normalized) || /^away win$/i.test(normalized)) {
    return {
      title: labels.awayWin.replace("{team}", fixture.teams.away.name),
      marketLabel: normalized,
    };
  }

  if (/^oavgjort$/i.test(normalized) || /^draw$/i.test(normalized)) {
    return {
      title: labels.draw,
      marketLabel: normalized,
    };
  }

  return null;
}

export function isOverMarketLabel(market: string) {
  const normalized = market.trim().toLowerCase();
  return normalized.startsWith("över") || normalized.startsWith("over");
}

export function isUnderMarketLabel(market: string) {
  const normalized = market.trim().toLowerCase();
  return normalized.startsWith("under");
}

export function isOverUnderMarketLabel(market: string) {
  return isOverMarketLabel(market) || isUnderMarketLabel(market);
}

function getOverUnderSortKey(market: string) {
  const match = market.match(/(\d+(?:\.\d+)?)/);
  return match ? Number.parseFloat(match[1]) : Number.MAX_SAFE_INTEGER;
}

export function splitOverUnderMarkets(markets: readonly string[]) {
  const over: string[] = [];
  const under: string[] = [];
  const other: string[] = [];

  for (const market of markets) {
    if (isOverMarketLabel(market)) {
      over.push(market);
    } else if (isUnderMarketLabel(market)) {
      under.push(market);
    } else {
      other.push(market);
    }
  }

  over.sort((a, b) => getOverUnderSortKey(a) - getOverUnderSortKey(b));
  under.sort((a, b) => getOverUnderSortKey(a) - getOverUnderSortKey(b));

  return { over, under, other };
}

export function getMatchResultMarkets(markets: readonly string[]) {
  return markets.filter(isMatchResultMarket);
}
