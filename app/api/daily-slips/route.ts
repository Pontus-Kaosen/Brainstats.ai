import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  attachSlipLanguage,
  buildDailySlipsSystemPrompt,
  buildDailySlipsUserPrompt,
  DAILY_SLIPS_VERSION,
  type DailySlipFixtureScope,
  getDailySlipsApiMessages,
  getSlipFixtureScope,
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
  addDaysToDateKey,
  getFixtureStockholmDateKey,
  getStockholmDateKey,
} from "@/lib/stockholmDate";
import {
  isAiDailySlipLeague,
  POPULAR_LEAGUE_IDS,
} from "@/lib/footballFixtures";
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

const EXCLUDED_LEAGUE_PATTERN =
  /\b(women|woman|women's|feminine|female|youth|u17|u18|u19|u20|u21|u23|reserve|reserves|academy|amateur)\b/i;

const POPULAR_LEAGUE_ID_SET = new Set(POPULAR_LEAGUE_IDS);

function isAllowedLeagueName(name: string) {
  return !EXCLUDED_LEAGUE_PATTERN.test(name);
}

function filterSlipPicksToPool<
  T extends { fixtureId?: number | null; match?: string },
>(
  picks: T[],
  allowedFixtureIds: Set<number>,
  allowPlaceholder = false
) {
  return picks.filter((pick) => {
    if (allowPlaceholder && !pick.fixtureId && pick.match) {
      return true;
    }

    return (
      typeof pick.fixtureId === "number" &&
      allowedFixtureIds.has(pick.fixtureId)
    );
  });
}

function slipHasValidPicks(
  slip: { picks: import("@/lib/aiPrompts").SlipPickMeta[] },
  allowedFixtureIds: Set<number>,
  fixtureScope: DailySlipFixtureScope
) {
  const picks = stripMetaPicks(slip.picks);

  if (picks.length < 1) {
    return false;
  }

  if (fixtureScope === "placeholder") {
    return picks.every((pick) => !pick.fixtureId && Boolean(pick.match));
  }

  return picks.every(
    (pick) =>
      typeof pick.fixtureId === "number" &&
      allowedFixtureIds.has(pick.fixtureId)
  );
}

function getValidCachedSlips<
  T extends { picks: import("@/lib/aiPrompts").SlipPickMeta[] },
>(
  slips: T[],
  allowedFixtureIds: Set<number>,
  fixtureScope: DailySlipFixtureScope
) {
  return slips.filter((slip) =>
    slipHasValidPicks(slip, allowedFixtureIds, fixtureScope)
  );
}

function cachedSlipsAreValid<
  T extends { picks: import("@/lib/aiPrompts").SlipPickMeta[] },
>(
  slips: T[],
  allowedFixtureIds: Set<number>,
  language: Language,
  fixtureScope: DailySlipFixtureScope
) {
  if (slips.length < 1) {
    return false;
  }

  if (getSlipVersion(slips[0]?.picks || []) !== DAILY_SLIPS_VERSION) {
    return false;
  }

  if ((getSlipLanguage(slips[0]?.picks || []) ?? "sv") !== language) {
    return false;
  }

  if (getSlipFixtureScope(slips[0]?.picks || []) !== fixtureScope) {
    return false;
  }

  return getValidCachedSlips(slips, allowedFixtureIds, fixtureScope).length >= 1;
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
  allowedFixtureIds: Set<number>,
  fixtureScope: DailySlipFixtureScope
) {
  const enriched = slips
    .map((slip) => {
      const tier = resolveSafetyTier({
        slipIndex: slip.slip_index,
        risk: slip.risk,
        title: slip.title,
      });
      const grade = getSafetyGrade(tier, language);
      const picks = filterSlipPicksToPool(
        stripMetaPicks(slip.picks),
        allowedFixtureIds,
        fixtureScope === "placeholder"
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
    .filter((slip) => slip.picks.length >= 1);

  return sortSlipsBySafety(enriched);
}

type TodayFixture = {
  fixtureId: number;
  date: string;
  leagueId: number;
  league: string;
  country: string;
  homeTeam: string;
  awayTeam: string;
};

type FixturePool = {
  fixtures: TodayFixture[];
  scope: DailySlipFixtureScope;
  referenceDateKey: string;
};

function buildStaticPlaceholderSlip(language: Language): GeneratedSlip[] {
  const grade = getSafetyGrade(1, language);

  if (language === "en") {
    return [
      {
        title: grade.label,
        risk: grade.label,
        confidence: 60,
        picks: [
          {
            match: "BrainStats AI picks",
            market: "New picks appear when upcoming matches are available",
            probability: 50,
            fixtureId: null,
            kickoffAt: null,
          },
        ],
      },
    ];
  }

  return [
    {
      title: grade.label,
      risk: grade.label,
      confidence: 60,
      picks: [
        {
          match: "BrainStats AI-tips",
          market: "Nya tips visas när kommande matcher finns tillgängliga",
          probability: 50,
          fixtureId: null,
          kickoffAt: null,
        },
      ],
    },
  ];
}

function buildFallbackSlips(
  fixtures: TodayFixture[],
  limit: number,
  language: Language
): GeneratedSlip[] {
  if (fixtures.length === 0) {
    return [];
  }

  const markets =
    language === "en"
      ? ["Double chance", "Over 1.5 goals", "Home win"]
      : ["Dubbelchans", "Över 1.5 mål", "Hemmalag vinner"];

  const slips: GeneratedSlip[] = [];
  const targetCount = Math.min(limit, fixtures.length);

  for (let index = 0; index < targetCount; index += 1) {
    const fixture = fixtures[index];
    const grade = getSafetyGrade(index + 1, language);

    slips.push({
      title: grade.label,
      risk: grade.label,
      confidence: Math.max(55, 78 - index * 5),
      picks: [
        {
          match: `${fixture.homeTeam} - ${fixture.awayTeam}`,
          market: markets[index % markets.length],
          probability: Math.max(55, 68 - index * 3),
          fixtureId: fixture.fixtureId,
          kickoffAt: fixture.date,
        },
      ],
    });
  }

  return slips.length > 0 ? slips : [];
}

async function fetchFixturesForDate(
  dateKey: string,
  allowLeague: (leagueId: number, leagueName: string) => boolean
): Promise<TodayFixture[]> {
  const apiKey = process.env.API_FOOTBALL_KEY;

  if (!apiKey) {
    throw new Error("API_FOOTBALL_KEY saknas i .env.local.");
  }

  const query = new URLSearchParams({
    date: dateKey,
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
      `API-Football misslyckades för ${dateKey}:`,
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
    console.error(`API-Football-fel för ${dateKey}:`, data.errors);

    return [];
  }

  return (Array.isArray(data?.response) ? data.response : [])
    .filter((fixture: any) => {
      const status = fixture.fixture?.status?.short;

      return status === "NS" || status === "TBD";
    })
    .filter((fixture: any) => {
      const leagueId = fixture.league?.id;
      const leagueName = fixture.league?.name || "";

      return (
        fixture.fixture?.id &&
        fixture.fixture?.date &&
        leagueId &&
        allowLeague(leagueId, leagueName) &&
        fixture.teams?.home?.name &&
        fixture.teams?.away?.name &&
        getFixtureStockholmDateKey(fixture.fixture.date) === dateKey
      );
    })
    .sort(
      (a: any, b: any) =>
        new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
    )
    .slice(0, 60)
    .map((fixture: any) => ({
      fixtureId: fixture.fixture.id,
      date: fixture.fixture.date,
      leagueId: fixture.league.id,
      league: fixture.league?.name || "Okänd liga",
      country: fixture.league?.country || "Okänt land",
      homeTeam: fixture.teams.home.name,
      awayTeam: fixture.teams.away.name,
    }));
}

async function resolveDailySlipFixtures(
  todayKey: string
): Promise<FixturePool> {
  const majorToday = await fetchFixturesForDate(todayKey, (leagueId) =>
    isAiDailySlipLeague(leagueId)
  );

  if (majorToday.length > 0) {
    console.log(
      `Daily slips: ${majorToday.length} matcher i större ligor idag.`
    );

    return {
      fixtures: majorToday,
      scope: "major_today",
      referenceDateKey: todayKey,
    };
  }

  const popularToday = await fetchFixturesForDate(
    todayKey,
    (leagueId) => POPULAR_LEAGUE_ID_SET.has(leagueId)
  );

  if (popularToday.length > 0) {
    console.log(
      `Daily slips: ${popularToday.length} matcher i populära ligor idag.`
    );

    return {
      fixtures: popularToday,
      scope: "popular_today",
      referenceDateKey: todayKey,
    };
  }

  const allToday = await fetchFixturesForDate(todayKey, (_leagueId, leagueName) =>
    isAllowedLeagueName(leagueName)
  );

  if (allToday.length > 0) {
    console.log(`Daily slips: ${allToday.length} matcher idag (alla ligor).`);

    return {
      fixtures: allToday,
      scope: "all_today",
      referenceDateKey: todayKey,
    };
  }

  for (let offset = 1; offset <= 14; offset += 1) {
    const dateKey = addDaysToDateKey(todayKey, offset);
    const upcomingMajor = await fetchFixturesForDate(dateKey, (leagueId) =>
      isAiDailySlipLeague(leagueId)
    );

    if (upcomingMajor.length > 0) {
      console.log(
        `Daily slips: ${upcomingMajor.length} kommande matcher i större ligor (${dateKey}).`
      );

      return {
        fixtures: upcomingMajor,
        scope: "upcoming",
        referenceDateKey: dateKey,
      };
    }
  }

  console.log("Daily slips: inga matcher hittades — använder platshållare.");

  return {
    fixtures: [],
    scope: "placeholder",
    referenceDateKey: todayKey,
  };
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
  allowedFixtureIds: Set<number>
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
          ? filterSlipPicksToPool(
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
              allowedFixtureIds
            )
          : [],
      })
    )
    .filter((slip: GeneratedSlip) => slip.picks.length >= 1);
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
    const fixturePool = await resolveDailySlipFixtures(today);
    const { fixtures, scope: fixtureScope, referenceDateKey } = fixturePool;
    const allowedFixtureIds = new Set(
      fixtures.map((fixture) => fixture.fixtureId)
    );

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
        allowedFixtureIds,
        language,
        fixtureScope
      )
    ) {
      const validCachedSlips = getValidCachedSlips(
        existingSlips,
        allowedFixtureIds,
        fixtureScope
      ).slice(0, slipLimit);

      return NextResponse.json({
        success: true,
        plan,
        slipLimit,
        fixtureScope,
        referenceDateKey,
        fixturesFound: fixtures.length,
        generatedToday: false,
        slips: serializeSlipsForResponse(
          validCachedSlips,
          language,
          allowedFixtureIds,
          fixtureScope
        ),
      });
    }

    if (existingSlips.length > 0) {
      await deleteTodaySlipsForUser(user.id, today);
    }

    let generatedSlips: GeneratedSlip[] = [];

    if (fixtureScope === "placeholder") {
      generatedSlips = buildStaticPlaceholderSlip(language);
    } else {
      const targetSlipCount = Math.max(
        1,
        Math.min(slipLimit, fixtures.length)
      );

      try {
        const completion = await openai.chat.completions.create({
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
                targetSlipCount,
                plan,
                fixtures
              ),
            },
          ],
        });

        const content = completion.choices[0]?.message?.content || "{}";

        generatedSlips = parseGeneratedSlips(
          content,
          targetSlipCount,
          language,
          fixtures,
          allowedFixtureIds
        );
      } catch (generationError) {
        console.warn("Daily slips AI generation failed:", generationError);
      }

      if (generatedSlips.length === 0) {
        generatedSlips = buildFallbackSlips(
          fixtures,
          Math.max(1, Math.min(slipLimit, fixtures.length)),
          language
        );
      }
    }

    if (generatedSlips.length === 0) {
      generatedSlips = buildStaticPlaceholderSlip(language);
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
          language,
          fixtureScope
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
      fixtureScope,
      referenceDateKey,
      fixturesFound: fixtures.length,
      generatedToday: true,
      slips: serializeSlipsForResponse(
        inserted || [],
        language,
        allowedFixtureIds,
        fixtureScope
      ),
    });
  } catch (error: unknown) {
    console.error("DAILY SLIPS ERROR:", error);

    const fallbackLanguage = parseRequestLanguage(
      new URL(request.url).searchParams.get("lang")
    );

    try {
      const today = getStockholmDateKey();
      const emergencySlips = buildStaticPlaceholderSlip(fallbackLanguage);

      return NextResponse.json({
        success: true,
        plan: "free",
        slipLimit: 1,
        fixtureScope: "placeholder",
        referenceDateKey: today,
        fixturesFound: 0,
        generatedToday: true,
        slips: serializeSlipsForResponse(
          [
            {
              id: "placeholder",
              valid_date: today,
              slip_index: 1,
              title: emergencySlips[0].title,
              risk: emergencySlips[0].risk,
              confidence: emergencySlips[0].confidence,
              picks: attachSlipLanguage(
                emergencySlips[0].picks.map((pick) => ({
                  match: pick.match,
                  market: pick.market,
                  probability: pick.probability,
                  estimatedOdds: calculateFairOdds(pick.probability),
                })),
                fallbackLanguage,
                "placeholder"
              ),
            },
          ],
          fallbackLanguage,
          new Set<number>(),
          "placeholder"
        ),
      });
    } catch {
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
}