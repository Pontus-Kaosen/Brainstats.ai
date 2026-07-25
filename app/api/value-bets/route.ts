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

const MIN_EDGE_PERCENT = 2;
const MAX_FIXTURES_WITH_ODDS = 18;
const MAX_VALUE_PICKS = 5;

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
  const pool: Array<{
    fixtureId: number;
    match: string;
    league: string;
    kickoffAt: string;
    rawOptions: MarketOddOption[];
    markets: Array<{
      market: string;
      selection: string;
      decimalOdd: number;
      impliedProbability: number;
    }>;
  }> = [];

  for (const fixture of fixtures.slice(0, MAX_FIXTURES_WITH_ODDS)) {
    const oddsResponse = await fetchFixtureOdds(fixture.fixtureId);
    const options = extractMarketOdds(oddsResponse);

    if (options.length === 0) {
      continue;
    }

    pool.push({
      fixtureId: fixture.fixtureId,
      match: `${fixture.homeTeam} - ${fixture.awayTeam}`,
      league: fixture.league,
      kickoffAt: fixture.date,
      rawOptions: options,
      markets: options.map((option) => ({
        market: formatMarketLabel(option.market, option.selection),
        selection: option.selection,
        decimalOdd: option.decimalOdd,
        impliedProbability: option.impliedProbability,
      })),
    });
  }

  return pool;
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

  const enriched: ValueBetPick[] = [];

  for (const pick of rawPicks) {
    const match = typeof pick.match === "string" ? pick.match : unknownMatch;
    const market = normalizeMarketLabel(
      typeof pick.market === "string" ? pick.market : unknownMarket,
      language
    );
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

    const marketOdd = matchMarketOdd(oddsEntry.rawOptions, market);

    if (!marketOdd) {
      continue;
    }

    const edgePercent = calculateEdgePercent(
      fairProbability,
      marketOdd.decimalOdd
    );

    if (edgePercent < MIN_EDGE_PERCENT) {
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

  return enriched
    .sort((a, b) => b.edgePercent - a.edgePercent)
    .slice(0, MAX_VALUE_PICKS);
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
    const { data: cached, error: cachedError } = await supabaseAdmin
      .from("value_bets")
      .select("picks, fixture_scope, reference_date_key")
      .eq("valid_date", today)
      .maybeSingle();

    if (cachedError && cachedError.code !== "PGRST116" && cachedError.code !== "42P01") {
      throw cachedError;
    }

    if (cached?.picks) {
      return NextResponse.json({
        success: true,
        plan: "elite",
        picks: cached.picks,
        fixtureScope: cached.fixture_scope,
        referenceDateKey: cached.reference_date_key || today,
        cached: true,
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
          content: buildValueBetsUserPrompt(language, fixtureOddsPool),
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      throw new Error(messages.createFailed);
    }

    const parsed = JSON.parse(cleanOpenAIJson(content));
    const rawPicks = Array.isArray(parsed?.picks) ? parsed.picks : [];
    const picks = enrichValuePicks(rawPicks, fixtures, fixtureOddsPool, language);

    await supabaseAdmin.from("value_bets").upsert(
      {
        valid_date: today,
        picks,
        fixture_scope: fixtureScope,
        reference_date_key: referenceDateKey,
      },
      { onConflict: "valid_date" }
    );

    return NextResponse.json({
      success: true,
      plan: "elite",
      picks,
      fixtureScope,
      referenceDateKey,
      cached: false,
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
