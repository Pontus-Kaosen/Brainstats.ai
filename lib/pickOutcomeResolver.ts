export type PickOutcome = "pending" | "won" | "lost" | "void";

export type FixtureResult = {
  status: string;
  homeGoals: number;
  awayGoals: number;
  homeTeam: string;
  awayTeam: string;
};

const FINISHED_STATUSES = new Set(["FT", "AET", "PEN"]);

export function isFixtureFinished(status: string | undefined | null) {
  return FINISHED_STATUSES.has(String(status || "").toUpperCase());
}

export function fixtureResultFromApi(fixture: any): FixtureResult | null {
  if (!fixture) {
    return null;
  }

  const homeGoals = fixture?.goals?.home;
  const awayGoals = fixture?.goals?.away;

  if (homeGoals == null || awayGoals == null) {
    return null;
  }

  return {
    status: fixture?.fixture?.status?.short || "",
    homeGoals: Number(homeGoals),
    awayGoals: Number(awayGoals),
    homeTeam: fixture?.teams?.home?.name || "",
    awayTeam: fixture?.teams?.away?.name || "",
  };
}

function normalizeMarket(market: string) {
  return market.trim().toLowerCase();
}

function parseGoalLine(market: string, kind: "over" | "under") {
  const pattern =
    kind === "over"
      ? /(?:over|över|o)\s*([\d]+(?:[.,]\d+)?)/i
      : /(?:under|u)\s*([\d]+(?:[.,]\d+)?)/i;

  const match = market.match(pattern);

  if (!match) {
    return null;
  }

  return Number.parseFloat(match[1].replace(",", "."));
}

export function resolvePickOutcome(
  marketInput: string,
  result: FixtureResult
): PickOutcome {
  if (!isFixtureFinished(result.status)) {
    return "pending";
  }

  const market = normalizeMarket(marketInput);
  const totalGoals = result.homeGoals + result.awayGoals;
  const bothScored = result.homeGoals > 0 && result.awayGoals > 0;
  const homeWin = result.homeGoals > result.awayGoals;
  const awayWin = result.awayGoals > result.homeGoals;
  const draw = result.homeGoals === result.awayGoals;

  const overLine = parseGoalLine(market, "over");
  if (overLine != null) {
    return totalGoals > overLine ? "won" : "lost";
  }

  const underLine = parseGoalLine(market, "under");
  if (underLine != null) {
    return totalGoals < underLine ? "won" : "lost";
  }

  if (
    /both teams to score|btts|båda lagen gör mål|båda gör mål|båda lagen score/i.test(
      market
    )
  ) {
    const negated = /(inte|no|nej|without)/i.test(market);
    if (negated) {
      return bothScored ? "lost" : "won";
    }

    return bothScored ? "won" : "lost";
  }

  if (/^1$|home win|hemmaseger|hemma vinner|home/i.test(market)) {
    return homeWin ? "won" : "lost";
  }

  if (/^2$|away win|bortaseger|borta vinner|away/i.test(market)) {
    return awayWin ? "won" : "lost";
  }

  if (/^x$|draw|oavgjort|oavg/i.test(market)) {
    return draw ? "won" : "lost";
  }

  const homeName = result.homeTeam.toLowerCase();
  const awayName = result.awayTeam.toLowerCase();

  if (
    homeName &&
    market.includes(homeName) &&
    /(win|vinner|seger|vinst)/i.test(market)
  ) {
    return homeWin ? "won" : "lost";
  }

  if (
    awayName &&
    market.includes(awayName) &&
    /(win|vinner|seger|vinst)/i.test(market)
  ) {
    return awayWin ? "won" : "lost";
  }

  if (/(double chance|dubbelchans|1x|x2|12)/i.test(market)) {
    if (/1x/i.test(market)) {
      return homeWin || draw ? "won" : "lost";
    }

    if (/x2/i.test(market)) {
      return awayWin || draw ? "won" : "lost";
    }

    if (/12/i.test(market)) {
      return homeWin || awayWin ? "won" : "lost";
    }
  }

  return "void";
}

export function findFixtureIdFromLabel(
  matchLabel: string,
  fixtures: Array<{
    fixtureId: number;
    homeTeam: string;
    awayTeam: string;
  }>
) {
  const normalized = matchLabel.toLowerCase();

  for (const fixture of fixtures) {
    const home = fixture.homeTeam.toLowerCase();
    const away = fixture.awayTeam.toLowerCase();

    if (normalized.includes(home) && normalized.includes(away)) {
      return fixture.fixtureId;
    }
  }

  return null;
}

export function brainScoreToSafetyTier(score: number): 1 | 2 | 3 | 4 | 5 {
  if (score >= 82) return 1;
  if (score >= 76) return 2;
  if (score >= 68) return 3;
  if (score >= 60) return 4;

  return 5;
}
