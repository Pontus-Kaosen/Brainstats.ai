export type MarketOddOption = {
  market: string;
  selection: string;
  decimalOdd: number;
  impliedProbability: number;
};

function parseDecimalOdd(value: unknown) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 1) {
    return null;
  }

  return parsed;
}

function impliedProbability(odd: number) {
  return Number(((1 / odd) * 100).toFixed(1));
}

export function extractMarketOdds(oddsResponse: unknown[]): MarketOddOption[] {
  if (!Array.isArray(oddsResponse) || oddsResponse.length === 0) {
    return [];
  }

  const first = oddsResponse[0] as { bookmakers?: Array<{ name?: string; bets?: Array<{ name?: string; values?: Array<{ value?: string; odd?: string }> }> }> };
  const bookmakers = first?.bookmakers || [];
  const preferred =
    bookmakers.find((item: { name?: string }) =>
      /unibet|betsson|leovegas|atg|svenska spel|nordicbet|coolbet/i.test(item?.name || "")
    ) ||
    bookmakers.find((item: { name?: string }) =>
      /bet365|pinnacle|william hill|betfair/i.test(item?.name || "")
    ) ||
    bookmakers[0];

  if (!preferred?.bets?.length) {
    return [];
  }

  const wanted = ["Match Winner", "Goals Over/Under", "Both Teams Score"];
  const options: MarketOddOption[] = [];

  for (const betName of wanted) {
    const bet = preferred.bets.find((item: { name?: string }) => item?.name === betName);

    if (!bet?.values?.length) {
      continue;
    }

    for (const entry of bet.values.slice(0, 8)) {
      const decimalOdd = parseDecimalOdd(entry?.odd);

      if (!decimalOdd) {
        continue;
      }

      options.push({
        market: betName,
        selection: String(entry?.value || ""),
        decimalOdd,
        impliedProbability: impliedProbability(decimalOdd),
      });
    }
  }

  return options;
}

export function calculateFairOdds(probability: number) {
  const safeProbability = Math.min(95, Math.max(10, probability));

  return Number((100 / safeProbability).toFixed(2));
}

export function calculateEdgePercent(fairProbability: number, marketOdd: number) {
  const fair = Math.min(95, Math.max(5, fairProbability));
  const edge = (fair / 100) * marketOdd - 1;

  return Number((edge * 100).toFixed(1));
}

export function formatMarketLabel(market: string, selection: string) {
  if (market === "Match Winner") {
    if (/^home$/i.test(selection)) return "Home win";
    if (/^away$/i.test(selection)) return "Away win";
    if (/^draw$/i.test(selection)) return "Draw";
  }

  if (market === "Goals Over/Under") {
    return selection.replace("Over", "Over ").replace("Under", "Under ");
  }

  if (market === "Both Teams Score") {
    if (/^yes$/i.test(selection)) return "Both teams to score";
    if (/^no$/i.test(selection)) return "Both teams not to score";
  }

  return `${market} · ${selection}`;
}

const MARKET_LABELS_SV: Record<string, string> = {
  "Home win": "Hemmalag vinner",
  "Away win": "Bortalag vinner",
  Draw: "Oavgjort",
  "Over 1.5 goals": "Över 1.5 mål",
  "Over 2.5 goals": "Över 2.5 mål",
  "Under 2.5 goals": "Under 2.5 mål",
  "Under 3.5 goals": "Under 3.5 mål",
  "Both teams to score": "Båda lagen gör mål",
  "Both teams not to score": "Båda lagen gör inte mål",
};

export function localizeMarketLabel(
  market: string,
  language: "sv" | "en"
) {
  if (language === "en") {
    return market;
  }

  return MARKET_LABELS_SV[market.trim()] || market;
}

export function matchMarketOdd(
  options: MarketOddOption[],
  marketLabel: string
): MarketOddOption | null {
  const normalized = marketLabel.trim().toLowerCase();

  const direct = options.find((option) => {
    const label = formatMarketLabel(option.market, option.selection).toLowerCase();
    return label === normalized || option.selection.toLowerCase() === normalized;
  });

  if (direct) {
    return direct;
  }

  const aliases: Record<string, string[]> = {
    "home win": ["home"],
    "away win": ["away"],
    draw: ["draw"],
    "both teams to score": ["yes"],
    "both teams not to score": ["no"],
  };

  for (const [label, selections] of Object.entries(aliases)) {
    if (!normalized.includes(label)) {
      continue;
    }

    const match = options.find((option) =>
      selections.some((value) => option.selection.toLowerCase() === value)
    );

    if (match) {
      return match;
    }
  }

  if (normalized.includes("over 2.5")) {
    return (
      options.find(
        (option) =>
          option.market === "Goals Over/Under" &&
          /over 2\.5/i.test(option.selection)
      ) || null
    );
  }

  if (normalized.includes("over 1.5")) {
    return (
      options.find(
        (option) =>
          option.market === "Goals Over/Under" &&
          /over 1\.5/i.test(option.selection)
      ) || null
    );
  }

  if (normalized.includes("under 3.5")) {
    return (
      options.find(
        (option) =>
          option.market === "Goals Over/Under" &&
          /under 3\.5/i.test(option.selection)
      ) || null
    );
  }

  if (normalized.includes("under 2.5")) {
    return (
      options.find(
        (option) =>
          option.market === "Goals Over/Under" &&
          /under 2\.5/i.test(option.selection)
      ) || null
    );
  }

  return null;
}

export async function fetchFixtureOdds(fixtureId: number) {
  const apiKey = process.env.API_FOOTBALL_KEY;

  if (!apiKey) {
    return [];
  }

  try {
    const response = await fetch(
      `https://v3.football.api-sports.io/odds?fixture=${fixtureId}`,
      {
        headers: {
          "x-apisports-key": apiKey,
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return [];
    }

    return Array.isArray(data?.response) ? data.response : [];
  } catch {
    return [];
  }
}
