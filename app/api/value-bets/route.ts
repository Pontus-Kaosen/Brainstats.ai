import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  buildValueBetsSystemPrompt,
  buildValueBetsUserPrompt,
  getValueBetsApiMessages,
  parseRequestLanguage,
} from "@/lib/aiPrompts";
import { resolveDailySlipFixtures } from "@/lib/dailyFixturePool";
import { findFixtureIdFromLabel } from "@/lib/pickOutcomeResolver";
import {
  calculateEdgePercent,
  calculateFairOdds,
  extractMarketOdds,
  fetchFixtureOdds,
  formatMarketLabel,
  matchMarketOdd,
  type MarketOddOption,
} from "@/lib/marketOdds";
import { getStockholmDateKey } from "@/lib/stockholmDate";
import { rankValueBetPicks, passesValueBetSafetyGate } from "@/lib/valueBetGrades";
import { publishValueBetPicks, getValueBetCalibrationNote } from "@/lib/trackRecordStore";
import {
  filterPlaceableValueBets,
  parseStoredValueBetPicks,
} from "@/lib/valueBetsCache";
import {
  isBettableOnMajorBookmakers,
  normalizeToBettableMarket,
  toDisplayMarketLabel,
} from "@/lib/bettableMarkets";

export const maxDuration = 60;

export type ValueBetPick = {
  match: string;
  market: string;
  fixtureId: number;
  kickoffAt: string | null;
  league: string;
  fairProbability: number;
  fairOdds: number;
  marketOdds: number;
  impliedProbability: number;
  edgePercent: number;
  reason: string;
  valueTier?: 1 | 2 | 3 | 4 | 5;
  valueScore?: number;
  valueRank?: number;
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const MIN_EDGE_PERCENT = 4;
const MIN_FAIR_PROBABILITY = 58;
const MAX_FIXTURES_WITH_ODDS = 10;
const MAX_VALUE_PICKS = 2;
const ODDS_FETCH_CONCURRENCY = 6;
const OPENAI_ATTEMPTS = 2;

function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) {
    return false;
  }

  const message = (error.message || "").toLowerCase();

  return (
    error.code === "42P01" ||
    error.code === "PGRST116" ||
    error.code === "PGRST205" ||
    (message.includes("value_bets") &&
      (message.includes("could not find") || message.includes("does not exist")))
  );
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T) => Promise<R>
) {
  const results: R[] = [];

  for (let index = 0; index < items.length; index += limit) {
    const batch = items.slice(index, index + limit);
    const batchResults = await Promise.all(batch.map(mapper));
    results.push(...batchResults);
  }

  return results;
}

function cleanOpenAIJson(content: string) {
  return content
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function normalizeMarketLabel(market: string, language: ReturnType<typeof parseRequestLanguage>) {
  const value = market.trim();

  if (language === "en") {
    return value;
  }

  const map: Record<string, string> = {
    "Hemmalag vinner": "Home win",
    "Bortalag vinner": "Away win",
    Oavgjort: "Draw",
    "Över 1.5 mål": "Over 1.5 goals",
    "Över 2.5 mål": "Over 2.5 goals",
    "Under 3.5 mål": "Under 3.5 goals",
    "Båda lagen gör mål": "Both teams to score",
    "Båda lagen gör inte mål": "Both teams not to score",
  };

  return map[value] || value;
}

async function buildFixtureOddsPool(
  fixtures: Awaited<ReturnType<typeof resolveDailySlipFixtures>>["fixtures"]
) {
  const entries = await mapWithConcurrency(
    fixtures.slice(0, MAX_FIXTURES_WITH_ODDS),
    ODDS_FETCH_CONCURRENCY,
    async (fixture) => {
      const oddsResponse = await fetchFixtureOdds(fixture.fixtureId);
      const options = extractMarketOdds(oddsResponse);

      if (options.length === 0) {
        return null;
      }

      return {
        fixtureId: fixture.fixtureId,
        match: `${fixture.homeTeam} - ${fixture.awayTeam}`,
        league: fixture.league,
        kickoffAt: fixture.date,
        oddsResponse,
        rawOptions: options,
        markets: options.map((option) => ({
          market: formatMarketLabel(option.market, option.selection),
          selection: option.selection,
          decimalOdd: option.decimalOdd,
          impliedProbability: option.impliedProbability,
        })),
      };
    }
  );

  return entries.filter(
    (entry): entry is NonNullable<(typeof entries)[number]> => entry !== null
  );
}

async function requestValueBetPicks(
  language: ReturnType<typeof parseRequestLanguage>,
  fixtureOddsPool: Awaited<ReturnType<typeof buildFixtureOddsPool>>,
  calibrationNote: string
) {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < OPENAI_ATTEMPTS; attempt += 1) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: buildValueBetsSystemPrompt(language),
          },
          {
            role: "user",
            content: buildValueBetsUserPrompt(language, fixtureOddsPool, calibrationNote),
          },
        ],
      });

      const content = completion.choices[0]?.message?.content;

      if (!content) {
        throw new Error("OpenAI returned empty content");
      }

      return JSON.parse(cleanOpenAIJson(content));
    } catch (error) {
      lastError = error;
      console.error(`Value bets OpenAI attempt ${attempt + 1} failed:`, error);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("OpenAI value bets generation failed");
}

async function cacheValueBets(
  today: string,
  picks: ValueBetPick[],
  fixtureScope: string,
  referenceDateKey: string
) {
  const { error } = await supabaseAdmin.from("value_bets").upsert(
    {
      valid_date: today,
      picks,
      fixture_scope: fixtureScope,
      reference_date_key: referenceDateKey,
    },
    { onConflict: "valid_date", ignoreDuplicates: true }
  );

  if (error && !isMissingTableError(error)) {
    console.error("Value bets cache write failed:", error);
  }
}

function buildValueBetsResponse(
  picks: ValueBetPick[],
  options: {
    fixtureScope?: string | null;
    referenceDateKey: string;
    cached: boolean;
    locked: boolean;
    message?: string;
  }
) {
  return NextResponse.json({
    success: true,
    plan: "elite" as const,
    picks,
    fixtureScope: options.fixtureScope,
    referenceDateKey: options.referenceDateKey,
    cached: options.cached,
    locked: options.locked,
    message: options.message,
  });
}

async function readDailyValueBetsCache(today: string) {
  const { data, error } = await supabaseAdmin
    .from("value_bets")
    .select("picks, fixture_scope, reference_date_key")
    .eq("valid_date", today)
    .maybeSingle();

  if (error && !isMissingTableError(error)) {
    throw error;
  }

  return data;
}

function enrichValuePicks(
  rawPicks: Array<{
    match?: string;
    market?: string;
    probability?: number;
    reason?: string;
  }>,
  fixtures: Awaited<ReturnType<typeof resolveDailySlipFixtures>>["fixtures"],
  fixtureOddsPool: Awaited<ReturnType<typeof buildFixtureOddsPool>>,
  language: ReturnType<typeof parseRequestLanguage>
): ValueBetPick[] {
  const unknownMatch = language === "en" ? "Unknown match" : "Okänd match";
  const unknownMarket = language === "en" ? "Unknown market" : "Okänd marknad";

  const enriched: Array<Omit<ValueBetPick, "valueTier" | "valueScore" | "valueRank">> = [];

  for (const pick of rawPicks) {
    const match = typeof pick.match === "string" ? pick.match : unknownMatch;
    const rawMarket =
      typeof pick.market === "string" ? pick.market : unknownMarket;
    const canonical = normalizeToBettableMarket(
      normalizeMarketLabel(rawMarket, language),
      language
    );

    if (!canonical) {
      continue;
    }

    const market = toDisplayMarketLabel(canonical, language);
    const fairProbability = Math.min(
      95,
      Math.max(10, Number(pick.probability || 0))
    );
    const fixtureId = findFixtureIdFromLabel(match, fixtures);
    const fixtureMeta = fixtures.find((item) => item.fixtureId === fixtureId);
    const oddsEntry = fixtureOddsPool.find((item) => item.fixtureId === fixtureId);

    if (!fixtureId || !fixtureMeta || !oddsEntry) {
      continue;
    }

    const marketOdd = matchMarketOdd(oddsEntry.rawOptions, canonical);

    if (!marketOdd) {
      continue;
    }

    if (
      !isBettableOnMajorBookmakers(oddsEntry.oddsResponse, canonical, {
        minBookmakers: 2,
      })
    ) {
      continue;
    }

    const edgePercent = calculateEdgePercent(
      fairProbability,
      marketOdd.decimalOdd
    );

    if (edgePercent < MIN_EDGE_PERCENT || fairProbability < MIN_FAIR_PROBABILITY) {
      continue;
    }

    if (
      !passesValueBetSafetyGate(canonical, fairProbability, edgePercent)
    ) {
      continue;
    }

    enriched.push({
      match,
      market,
      fixtureId,
      kickoffAt: fixtureMeta.date,
      league: fixtureMeta.league,
      fairProbability,
      fairOdds: calculateFairOdds(fairProbability),
      marketOdds: marketOdd.decimalOdd,
      impliedProbability: marketOdd.impliedProbability,
      edgePercent,
      reason:
        typeof pick.reason === "string" && pick.reason.trim()
          ? pick.reason.trim()
          : language === "en"
            ? "AI fair probability appears above market implied probability."
            : "AI fair-sannolikhet verkar ligga över marknadens implicita sannolikhet.",
    });
  }

  return rankValueBetPicks(enriched, MAX_VALUE_PICKS);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const language = parseRequestLanguage(searchParams.get("lang"));
  const messages = getValueBetsApiMessages(language);

  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return NextResponse.json(
        { success: false, error: messages.mustLogin },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: messages.authFailed },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    if (profile?.plan !== "elite") {
      return NextResponse.json(
        {
          success: false,
          error: messages.eliteOnly,
          requiresElite: true,
        },
        { status: 403 }
      );
    }

    const today = getStockholmDateKey();
    const cached = await readDailyValueBetsCache(today);

    if (cached) {
      const storedPicks = parseStoredValueBetPicks(cached.picks);
      const placeablePicks = filterPlaceableValueBets(storedPicks);

      if (placeablePicks.length > 0) {
        void publishValueBetPicks(
          today,
          placeablePicks.map((pick) => ({
            fixtureId: pick.fixtureId,
            match: pick.match,
            market: pick.market,
            fairProbability: pick.fairProbability,
            edgePercent: pick.edgePercent,
            valueTier: pick.valueTier || 4,
            kickoffAt: pick.kickoffAt,
          }))
        );
      }

      return buildValueBetsResponse(placeablePicks, {
        fixtureScope: cached.fixture_scope,
        referenceDateKey: cached.reference_date_key || today,
        cached: true,
        locked: true,
        message:
          placeablePicks.length === 0
            ? language === "en"
              ? "Today's value bets have started or are no longer placeable."
              : "Dagens value bets har redan startat eller går inte längre att spela."
            : undefined,
      });
    }

    const fixturePool = await resolveDailySlipFixtures(today);
    const { fixtures, scope: fixtureScope, referenceDateKey } = fixturePool;

    if (fixtures.length === 0) {
      return NextResponse.json({
        success: true,
        plan: "elite",
        picks: [],
        fixtureScope,
        referenceDateKey,
        message: messages.noFixtures,
      });
    }

    const fixtureOddsPool = await buildFixtureOddsPool(fixtures);

    if (fixtureOddsPool.length === 0) {
      return NextResponse.json({
        success: true,
        plan: "elite",
        picks: [],
        fixtureScope,
        referenceDateKey,
        message: messages.noFixtures,
      });
    }

    const calibrationNote = await getValueBetCalibrationNote(language);
    const parsed = await requestValueBetPicks(language, fixtureOddsPool, calibrationNote);
    const rawPicks = Array.isArray(parsed?.picks) ? parsed.picks : [];
    const picks = enrichValuePicks(rawPicks, fixtures, fixtureOddsPool, language);

    await cacheValueBets(today, picks, fixtureScope, referenceDateKey);

    const lockedCache = await readDailyValueBetsCache(today);
    const finalPicks = lockedCache
      ? filterPlaceableValueBets(parseStoredValueBetPicks(lockedCache.picks))
      : filterPlaceableValueBets(picks);

    if (finalPicks.length > 0) {
      void publishValueBetPicks(
        today,
        finalPicks.map((pick) => ({
          fixtureId: pick.fixtureId,
          match: pick.match,
          market: pick.market,
          fairProbability: pick.fairProbability,
          edgePercent: pick.edgePercent,
          valueTier: pick.valueTier || 4,
          kickoffAt: pick.kickoffAt,
        }))
      );
    }

    return buildValueBetsResponse(finalPicks, {
      fixtureScope: lockedCache?.fixture_scope ?? fixtureScope,
      referenceDateKey: lockedCache?.reference_date_key || referenceDateKey,
      cached: Boolean(lockedCache),
      locked: Boolean(lockedCache),
      message:
        finalPicks.length === 0 ? messages.noValueFound : undefined,
    });
  } catch (error) {
    console.error("Value bets error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : messages.createFailed,
      },
      { status: 500 }
    );
  }
}
