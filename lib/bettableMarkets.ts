import { matchMarketOdd, type MarketOddOption } from "@/lib/marketOdds";

/** Standard 1X2 / mål / BTTS — finns hos Unibet, Betsson, LeoVegas, ATG, m.fl. */
export const BETTABLE_MARKET_LABELS_EN = [
  "Home win",
  "Away win",
  "Draw",
  "Over 1.5 goals",
  "Over 2.5 goals",
  "Under 2.5 goals",
  "Under 3.5 goals",
  "Both teams to score",
  "Both teams not to score",
] as const;

export const BETTABLE_MARKET_LABELS_SV = [
  "Hemmalag vinner",
  "Bortalag vinner",
  "Oavgjort",
  "Över 1.5 mål",
  "Över 2.5 mål",
  "Under 2.5 mål",
  "Under 3.5 mål",
  "Båda lagen gör mål",
  "Båda lagen gör inte mål",
] as const;

export type BettableMarketLabel = (typeof BETTABLE_MARKET_LABELS_EN)[number];

const SV_TO_EN: Record<string, BettableMarketLabel> = {
  "hemmalag vinner": "Home win",
  "bortalag vinner": "Away win",
  oavgjort: "Draw",
  "över 1.5 mål": "Over 1.5 goals",
  "over 1.5 goals": "Over 1.5 goals",
  "över 2.5 mål": "Over 2.5 goals",
  "over 2.5 goals": "Over 2.5 goals",
  "under 2.5 mål": "Under 2.5 goals",
  "under 2.5 goals": "Under 2.5 goals",
  "under 3.5 mål": "Under 3.5 goals",
  "under 3.5 goals": "Under 3.5 goals",
  "båda lagen gör mål": "Both teams to score",
  "both teams to score": "Both teams to score",
  "båda lagen gör inte mål": "Both teams not to score",
  "both teams not to score": "Both teams not to score",
  "home win": "Home win",
  "away win": "Away win",
  draw: "Draw",
};

const SWEDISH_BOOKMAKER =
  /unibet|betsson|leovegas|atg|svenska spel|nordicbet|coolbet|paf|expekt|mrgreen/i;

const MAJOR_BOOKMAKER =
  /bet365|pinnacle|william hill|betfair|unibet|betsson|leovegas|888sport|888|bwin|marathon|1xbet|nordicbet|coolbet|atg|svenska spel|expekt|draftkings|fanduel|betway|ladbrokes|betsafe/i;

type OddsBookmaker = {
  name?: string;
  bets?: Array<{
    name?: string;
    values?: Array<{ value?: string; odd?: string }>;
  }>;
};

type OddsFixture = {
  bookmakers?: OddsBookmaker[];
};

function extractOptionsFromBookmaker(bookmaker: OddsBookmaker): MarketOddOption[] {
  const wanted = ["Match Winner", "Goals Over/Under", "Both Teams Score"];
  const options: MarketOddOption[] = [];

  for (const betName of wanted) {
    const bet = bookmaker.bets?.find((item) => item?.name === betName);

    if (!bet?.values?.length) {
      continue;
    }

    for (const entry of bet.values.slice(0, 12)) {
      const parsed = Number(entry?.odd);

      if (!Number.isFinite(parsed) || parsed <= 1) {
        continue;
      }

      options.push({
        market: betName,
        selection: String(entry?.value || ""),
        decimalOdd: parsed,
        impliedProbability: Number(((1 / parsed) * 100).toFixed(1)),
      });
    }
  }

  return options;
}

export function normalizeToBettableMarket(
  marketInput: string,
  language: "sv" | "en" = "en"
): BettableMarketLabel | null {
  const trimmed = marketInput.trim();

  if (!trimmed) {
    return null;
  }

  const lower = trimmed.toLowerCase();

  if (
    /double chance|dubbelchans|draw no bet|dnb|handicap|spelarskott|player|assists|hörnor|corners|cards|kort/i.test(
      lower
    )
  ) {
    return null;
  }

  const directEn = BETTABLE_MARKET_LABELS_EN.find(
    (label) => label.toLowerCase() === lower
  );

  if (directEn) {
    return directEn;
  }

  const mapped = SV_TO_EN[lower];

  if (mapped) {
    return mapped;
  }

  if (language === "sv") {
    for (const [key, value] of Object.entries(SV_TO_EN)) {
      if (lower.includes(key)) {
        return value;
      }
    }
  }

  if (/^1$|home win|hemmaseger|hemma vinner|^home$/i.test(lower)) {
    return "Home win";
  }

  if (/^2$|away win|bortaseger|borta vinner|^away$/i.test(lower)) {
    return "Away win";
  }

  if (/^x$|draw|oavgjort|oavg/i.test(lower)) {
    return "Draw";
  }

  if (/(over|över|o)\s*1\.5/.test(lower)) {
    return "Over 1.5 goals";
  }

  if (/(over|över|o)\s*2\.5/.test(lower)) {
    return "Over 2.5 goals";
  }

  if (/under\s*2\.5/.test(lower)) {
    return "Under 2.5 goals";
  }

  if (/under\s*3\.5/.test(lower)) {
    return "Under 3.5 goals";
  }

  if (/(both teams to score|btts|båda lagen gör mål|båda gör mål)/i.test(lower)) {
    if (/(inte|not|no|nej|without)/i.test(lower)) {
      return "Both teams not to score";
    }

    return "Both teams to score";
  }

  return null;
}

export function toDisplayMarketLabel(
  canonical: BettableMarketLabel,
  language: "sv" | "en"
) {
  if (language === "en") {
    return canonical;
  }

  const index = BETTABLE_MARKET_LABELS_EN.indexOf(canonical);

  return index >= 0 ? BETTABLE_MARKET_LABELS_SV[index] : canonical;
}

export function getBettableMarketsPromptList(language: "sv" | "en") {
  return language === "en"
    ? BETTABLE_MARKET_LABELS_EN.map((label) => `- ${label}`).join("\n")
    : BETTABLE_MARKET_LABELS_SV.map((label) => `- ${label}`).join("\n");
}

export function countBookmakersOfferingMarket(
  oddsResponse: unknown[],
  marketLabel: string
) {
  const canonical = normalizeToBettableMarket(marketLabel);

  if (!canonical || !Array.isArray(oddsResponse) || oddsResponse.length === 0) {
    return {
      canonical: null as BettableMarketLabel | null,
      total: 0,
      swedish: 0,
      major: 0,
      bookmakers: [] as string[],
    };
  }

  const first = oddsResponse[0] as OddsFixture;
  const bookmakers = first?.bookmakers || [];
  const matchedNames: string[] = [];

  for (const bookmaker of bookmakers) {
    const name = String(bookmaker?.name || "").trim();

    if (!name) {
      continue;
    }

    const options = extractOptionsFromBookmaker(bookmaker);
    const hit = matchMarketOdd(options, canonical);

    if (hit) {
      matchedNames.push(name);
    }
  }

  const swedish = matchedNames.filter((name) => SWEDISH_BOOKMAKER.test(name)).length;
  const major = matchedNames.filter((name) => MAJOR_BOOKMAKER.test(name)).length;

  return {
    canonical,
    total: matchedNames.length,
    swedish,
    major,
    bookmakers: matchedNames,
  };
}

export function isBettableOnMajorBookmakers(
  oddsResponse: unknown[],
  marketLabel: string,
  options?: { minBookmakers?: number }
) {
  const minBookmakers = options?.minBookmakers ?? 2;
  const stats = countBookmakersOfferingMarket(oddsResponse, marketLabel);

  if (!stats.canonical) {
    return false;
  }

  if (stats.swedish >= 1) {
    return true;
  }

  return stats.major >= minBookmakers;
}

type PickWithFixture = {
  market: string;
  fixtureId?: number | null;
};

type SlipWithPicks = {
  picks: PickWithFixture[];
};

export async function filterSlipsToBettableMarkets<T extends SlipWithPicks>(
  slips: T[],
  language: "sv" | "en",
  fetchOdds: (fixtureId: number) => Promise<unknown[]>
): Promise<T[]> {
  const oddsCache = new Map<number, unknown[]>();

  async function loadOdds(fixtureId: number) {
    if (!oddsCache.has(fixtureId)) {
      oddsCache.set(fixtureId, await fetchOdds(fixtureId));
    }

    return oddsCache.get(fixtureId) || [];
  }

  const filtered: T[] = [];

  for (const slip of slips) {
    const picks: PickWithFixture[] = [];

    for (const pick of slip.picks) {
      const canonical = normalizeToBettableMarket(pick.market, language);

      if (!canonical) {
        continue;
      }

      if (pick.fixtureId) {
        const odds = await loadOdds(pick.fixtureId);

        if (odds.length > 0 && !isBettableOnMajorBookmakers(odds, canonical)) {
          continue;
        }
      }

      picks.push({
        ...pick,
        market: toDisplayMarketLabel(canonical, language),
      });
    }

    if (picks.length > 0) {
      filtered.push({ ...slip, picks } as T);
    }
  }

  return filtered;
}
