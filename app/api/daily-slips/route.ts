import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  attachSlipLanguage,
  buildDailySlipsSystemPrompt,
  buildDailySlipsUserPrompt,
  DAILY_SLIPS_VERSION,
  getDailySlipsApiMessages,
  getSlipLanguage,
  getSlipVersion,
  parseRequestLanguage,
  stripMetaPicks,
} from "@/lib/aiPrompts";
import {
  getSafetyGrade,
  resolveSafetyTier,
  sortSlipsBySafety,
} from "@/lib/safetyGrades";
import { findFixtureIdFromLabel } from "@/lib/pickOutcomeResolver";
import {
  getFixtureStockholmDateKey,
  getStockholmDateKey,
} from "@/lib/stockholmDate";
import { insertPublicTrackPick } from "@/lib/trackRecordStore";
import type { Language } from "@/lib/translations";

type UserPlan = "free" | "pro" | "elite";

type GeneratedPick = {
  match: string;
  market: string;
  probability: number;
  fixtureId?: number | null;
  kickoffAt?: string | null;
};

type GeneratedSlip = {
  title: string;
  risk: string;
  confidence: number;
  picks: GeneratedPick[];
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

function getSlipLimit(plan: UserPlan) {
  if (plan === "elite") return 5;
  if (plan === "pro") return 3;

  return 1;
}

function calculateFairOdds(probability: number) {
  const safeProbability = Math.min(
    95,
    Math.max(10, probability)
  );

  return Number((100 / safeProbability).toFixed(2));
}

function normalizeRisk(
  value: unknown,
  slipIndex: number,
  language: Language
) {
  const tier = slipIndex + 1;
  const grade = getSafetyGrade(tier, language);

  if (typeof value === "string") {
    const resolved = resolveSafetyTier({
      slipIndex: tier,
      risk: value,
      title: value,
    });

    if (resolved === tier) {
      return grade.label;
    }
  }

  return grade.label;
}

function isKickoffToday(kickoffAt: string | null | undefined, todayKey: string) {
  if (!kickoffAt) {
    return false;
  }

  return getFixtureStockholmDateKey(kickoffAt) === todayKey;
}

function filterSlipPicksToToday<
  T extends { kickoffAt?: string | null; fixtureId?: number | null },
>(picks: T[], todayKey: string, todayFixtureIds: Set<number>) {
  return picks.filter(
    (pick) =>
      typeof pick.fixtureId === "number" &&
      todayFixtureIds.has(pick.fixtureId) &&
      isKickoffToday(pick.kickoffAt, todayKey)
  );
}

function slipHasOnlyTodayPicks(
  slip: { picks: import("@/lib/aiPrompts").SlipPickMeta[] },
  todayKey: string,
  todayFixtureIds: Set<number>
) {
  const picks = stripMetaPicks(slip.picks);

  if (picks.length < 2) {
    return false;
  }

  return picks.every(
    (pick) =>
      typeof pick.fixtureId === "number" &&
      todayFixtureIds.has(pick.fixtureId) &&
      isKickoffToday(pick.kickoffAt, todayKey)
  );
}

function cachedSlipsAreValid(
  slips: Array<{ picks: import("@/lib/aiPrompts").SlipPickMeta[] }>,
  todayKey: string,
  todayFixtureIds: Set<number>,
  language: Language,
  slipLimit: number
) {
  if (slips.length < slipLimit) {
    return false;
  }

  if (getSlipVersion(slips[0]?.picks || []) !== DAILY_SLIPS_VERSION) {
    return false;
  }

  if ((getSlipLanguage(slips[0]?.picks || []) ?? "sv") !== language) {
    return false;
  }

  return slips
    .slice(0, slipLimit)
    .every((slip) => slipHasOnlyTodayPicks(slip, todayKey, todayFixtureIds));
}

async function deleteTodaySlipsForUser(userId: string, todayKey: string) {
  const { error } = await supabaseAdmin
    .from("daily_slips")
    .delete()
    .eq("user_id", userId)
    .eq("valid_date", todayKey);

  if (error) {
    throw error;
  }
}

function serializeSlipsForResponse(
  slips: Array<{
    id: string;
    valid_date: string;
    slip_index: number;
    title: string;
    risk: string;
    confidence: number;
    picks: import("@/lib/aiPrompts").SlipPickMeta[];
  }>,
  language: Language,
  todayKey: string,
  todayFixtureIds: Set<number>
) {
  const enriched = slips
    .map((slip) => {
      const tier = resolveSafetyTier({
        slipIndex: slip.slip_index,
        risk: slip.risk,
        title: slip.title,
      });
      const grade = getSafetyGrade(tier, language);
      const picks = filterSlipPicksToToday(
        stripMetaPicks(slip.picks),
        todayKey,
        todayFixtureIds
      );

      return {
        ...slip,
        title: grade.label,
        risk: grade.label,
        safetyTier: tier,
        safetyLabel: grade.label,
        safetyDescription: grade.description,
        safetyRank: tier,
        picks,
      };
    })
    .filter((slip) => slip.picks.length >= 2);

  return sortSlipsBySafety(enriched);
}

async function fetchTodayFixtures(todayKey: string): Promise<
  Array<{
    fixtureId: number;
    date: string;
    league: string;
    country: string;
    homeTeam: string;
    awayTeam: string;
  }>
> {
  const apiKey = process.env.API_FOOTBALL_KEY;

  if (!apiKey) {
    throw new Error("API_FOOTBALL_KEY saknas i .env.local.");
  }

  const query = new URLSearchParams({
    date: todayKey,
    timezone: "Europe/Stockholm",
  });

  const response = await fetch(
    `https://v3.football.api-sports.io/fixtures?${query.toString()}`,
    {
      headers: {
        "x-apisports-key": apiKey,
      },
      cache: "no-store",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error(
      `API-Football misslyckades för ${todayKey}:`,
      response.status,
      data
    );

    return [];
  }

  if (
    data?.errors &&
    typeof data.errors === "object" &&
    Object.keys(data.errors).length > 0
  ) {
    console.error(`API-Football-fel för ${todayKey}:`, data.errors);

    return [];
  }

  const fixtures = (Array.isArray(data?.response) ? data.response : [])
    .filter((fixture: any) => {
      const status = fixture.fixture?.status?.short;

      return status === "NS" || status === "TBD";
    })
    .filter(
      (fixture: any) =>
        fixture.fixture?.id &&
        fixture.fixture?.date &&
        fixture.teams?.home?.name &&
        fixture.teams?.away?.name &&
        getFixtureStockholmDateKey(fixture.fixture.date) === todayKey
    );

  console.log(
    `Daily slips: ${fixtures.length} matcher hittades för ${todayKey}.`
  );

  return fixtures.slice(0, 100).map((fixture: any) => ({
    fixtureId: fixture.fixture.id,
    date: fixture.fixture.date,
    league: fixture.league?.name || "Okänd liga",
    country: fixture.league?.country || "Okänt land",
    homeTeam: fixture.teams.home.name,
    awayTeam: fixture.teams.away.name,
  }));
}
  
function cleanOpenAIJson(content: string) {
  return content
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function parseGeneratedSlips(
  content: string,
  limit: number,
  language: ReturnType<typeof parseRequestLanguage>,
  fixtures: Array<{
    fixtureId: number;
    date?: string;
    homeTeam: string;
    awayTeam: string;
  }>,
  todayKey: string,
  todayFixtureIds: Set<number>
): GeneratedSlip[] {
  const cleaned = cleanOpenAIJson(content);
  const parsed = JSON.parse(cleaned);

  const rawSlips = Array.isArray(parsed?.slips)
    ? parsed.slips
    : [];

  const unknownMatch =
    language === "en" ? "Unknown match" : "Okänd match";
  const unknownMarket =
    language === "en" ? "Unknown market" : "Okänd marknad";

  return rawSlips
    .slice(0, limit)
    .map(
      (
        slip: any,
        slipIndex: number
      ): GeneratedSlip => ({
        risk: normalizeRisk(slip?.risk, slipIndex, language),

        title: getSafetyGrade(slipIndex + 1, language).label,

        confidence: Math.min(
          95,
          Math.max(
            20,
            Number(slip?.confidence || 60)
          )
        ),

        picks: Array.isArray(slip?.picks)
          ? filterSlipPicksToToday(
              slip.picks
                .slice(0, 3)
                .map((pick: any) => {
                  const match =
                    typeof pick?.match === "string"
                      ? pick.match
                      : unknownMatch;
                  const fixtureId = findFixtureIdFromLabel(match, fixtures);
                  const fixtureMeta = fixtures.find(
                    (item) => item.fixtureId === fixtureId
                  );

                  return {
                    match,
                    market:
                      typeof pick?.market === "string"
                        ? pick.market
                        : unknownMarket,
                    probability: Math.min(
                      95,
                      Math.max(
                        10,
                        Number(pick?.probability || 55)
                      )
                    ),
                    fixtureId,
                    kickoffAt: fixtureMeta?.date || null,
                  };
                }),
              todayKey,
              todayFixtureIds
            )
          : [],
      })
    )
    .filter((slip: GeneratedSlip) => {
      return slip.picks.length >= 2;
    });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const language = parseRequestLanguage(searchParams.get("lang"));
  const messages = getDailySlipsApiMessages(language);

  try {
    const authHeader =
      request.headers.get("authorization");

    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: messages.mustLogin,
        },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: messages.authFailed,
        },
        { status: 401 }
      );
    }

    const {
      data: profile,
      error: profileError,
    } = await supabaseAdmin
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    const plan: UserPlan =
      profile?.plan === "pro" ||
      profile?.plan === "elite"
        ? profile.plan
        : "free";

    const slipLimit = getSlipLimit(plan);
    const today = getStockholmDateKey();
    const fixtures = await fetchTodayFixtures(today);
    const todayFixtureIds = new Set(fixtures.map((fixture) => fixture.fixtureId));

    /*
     * Kontrollera om dagens kuponger redan finns
     * för den här användaren.
     */
    const {
      data: existing,
      error: existingError,
    } = await supabaseAdmin
      .from("daily_slips")
      .select(
        "id, valid_date, slip_index, title, risk, confidence, picks"
      )
      .eq("user_id", user.id)
      .eq("valid_date", today)
      .order("slip_index", {
        ascending: true,
      });

    if (existingError) {
      throw existingError;
    }

    const existingSlips = existing || [];

    if (
      cachedSlipsAreValid(
        existingSlips,
        today,
        todayFixtureIds,
        language,
        slipLimit
      )
    ) {
      return NextResponse.json({
        success: true,
        plan,
        slipLimit,
        fixturesFound: fixtures.length,
        generatedToday: false,
        slips: serializeSlipsForResponse(
          existingSlips.slice(0, slipLimit),
          language,
          today,
          todayFixtureIds
        ),
      });
    }

    if (existingSlips.length > 0) {
      await deleteTodaySlipsForUser(user.id, today);
    }

    console.log(
      `Daily slips: ${fixtures.length} dagens matcher hittades.`
    );

    if (fixtures.length < 3) {
      return NextResponse.json(
        {
          success: false,
          fixturesFound: fixtures.length,
          error: messages.notEnoughFixtures,
        },
        { status: 404 }
      );
    }

    const completion =
      await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        temperature: 0.3,
        response_format: {
          type: "json_object",
        },
        messages: [
          {
            role: "system",
            content: buildDailySlipsSystemPrompt(language),
          },
          {
            role: "user",
            content: buildDailySlipsUserPrompt(
              language,
              slipLimit,
              plan,
              fixtures
            ),
          },
        ],
      });

    const content =
      completion.choices[0]?.message
        ?.content || "{}";

    const generatedSlips = parseGeneratedSlips(
      content,
      slipLimit,
      language,
      fixtures,
      today,
      todayFixtureIds
    );

    if (generatedSlips.length < slipLimit) {
      throw new Error(
        messages.regenerateFailed(generatedSlips.length, slipLimit)
      );
    }

    const rows = generatedSlips.map(
      (slip, index) => ({
        user_id: user.id,
        valid_date: today,
        slip_index: index + 1,
        title: slip.title,
        risk: slip.risk,
        confidence: slip.confidence,

        picks: attachSlipLanguage(
          slip.picks.map((pick) => ({
            match: pick.match,
            market: pick.market,
            probability: pick.probability,
            estimatedOdds: calculateFairOdds(pick.probability),
            fixtureId: pick.fixtureId || undefined,
            kickoffAt: pick.kickoffAt || undefined,
          })),
          language
        ),
      })
    );

    const {
      data: inserted,
      error: insertError,
    } = await supabaseAdmin
      .from("daily_slips")
      .upsert(rows, {
        onConflict:
          "user_id,valid_date,slip_index",
      })
      .select(
        "id, valid_date, slip_index, title, risk, confidence, picks"
      )
      .order("slip_index", {
        ascending: true,
      });

    if (insertError) {
      throw insertError;
    }

    for (const [index, slip] of generatedSlips.entries()) {
      const featuredPick = slip.picks.find((pick) => pick.fixtureId);

      if (!featuredPick?.fixtureId) {
        continue;
      }

      const tier = resolveSafetyTier({
        slipIndex: index + 1,
        risk: slip.risk,
        title: slip.title,
      });

      void insertPublicTrackPick({
        sourceType: "daily_slip",
        sourceRef: `${user.id}:${today}:${index + 1}`,
        fixtureId: featuredPick.fixtureId,
        matchLabel: featuredPick.match,
        market: featuredPick.market,
        brainScore: slip.confidence,
        safetyTier: tier,
        probability: featuredPick.probability,
        kickoffAt: featuredPick.kickoffAt || null,
        note:
          language === "en"
            ? `Daily Brain Pick (${slip.title})`
            : `Dagligt AI-tips (${slip.title})`,
      });
    }

    return NextResponse.json({
      success: true,
      plan,
      slipLimit,
      fixturesFound: fixtures.length,
      generatedToday: true,
      slips: serializeSlipsForResponse(inserted || [], language, today, todayFixtureIds),
    });
  } catch (error: unknown) {
    console.error(
      "DAILY SLIPS ERROR:",
      error
    );

    const fallbackLanguage = parseRequestLanguage(
      new URL(request.url).searchParams.get("lang")
    );
    const fallbackMessages = getDailySlipsApiMessages(fallbackLanguage);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : fallbackMessages.createFailed,
      },
      { status: 500 }
    );
  }
}