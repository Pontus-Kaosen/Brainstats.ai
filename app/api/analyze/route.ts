import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  buildAnalyzeSystemPrompt,
  buildAnalyzeUserPrompt,
  getAnalyzeApiMessages,
  parseRequestLanguage,
} from "@/lib/aiPrompts";
import {
  areLineupsConfirmed,
  describePlayerLineupStatus,
  getPlayerLineupStatus,
  normalizeTeamLineup,
  orderLineupsForFixture,
  type PlayerLineupStatus,
} from "@/lib/lineups";
import {
  findRotationRisks,
  getScheduleContextStatus,
  resolveBetSides,
  type RotationRisk,
} from "@/lib/matchImportance";
import {
  applyAnalysisSafetyGuardrails,
  assessDataQuality,
  buildStructuredAnalysisContext,
  calculateEnhancedBrainScore,
  summarizeRecentForm,
} from "@/lib/analysisContext";
import {
  brainScoreToSafetyTier,
  getTrackRecordCalibrationNote,
  insertPublicTrackPick,
} from "@/lib/trackRecordStore";
import {
  applyWorthBettingGuardrails,
  deriveWorthBettingFallback,
  normalizeWorthBetting,
  type WorthBetting,
} from "@/lib/worthBetting";

type UserPlan = "free" | "pro" | "elite";

type BrainPick = {
  id: number;
  market: string;
  probability: number;
  estimatedOdds: number;
  riskLevel: "Low" | "Medium" | "High";
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

function extractNumber(text: string, label: string) {
  const match = text.match(
    new RegExp(`${label}:\\s*(\\d+)`, "i")
  );

  return match ? match[1] : null;
}

async function apiFootball(path: string) {
  const apiKey = process.env.API_FOOTBALL_KEY;

  if (!apiKey) {
    console.error("API_FOOTBALL_KEY saknas.");
    return [];
  }

  try {
    const response = await fetch(
      `https://v3.football.api-sports.io${path}`,
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
        `API-Football error ${response.status}: ${path}`,
        data
      );

      return [];
    }

    if (
      data?.errors &&
      typeof data.errors === "object" &&
      Object.keys(data.errors).length > 0
    ) {
      console.error(
        `API-Football errors för ${path}:`,
        data.errors
      );

      return [];
    }

    return data.response || [];
  } catch (error) {
    console.error(
      `API-Football kunde inte hämtas: ${path}`,
      error
    );

    return [];
  }
}

async function getFixture(
  fixtureId: string | null
) {
  if (!fixtureId) return null;

  const data = await apiFootball(
    `/fixtures?id=${fixtureId}`
  );

  return data?.[0] || null;
}

async function getTeamStats(
  teamId: string | null,
  leagueId: string,
  season: string
) {
  if (!teamId) return null;

  return apiFootball(
    `/teams/statistics?league=${leagueId}&season=${season}&team=${teamId}`
  );
}

async function getStandings(
  leagueId: string,
  season: string
) {
  const data = await apiFootball(
    `/standings?league=${leagueId}&season=${season}`
  );

  return data?.[0]?.league?.standings?.[0] || [];
}

async function getH2H(
  homeTeamId: string | null,
  awayTeamId: string | null
) {
  if (!homeTeamId || !awayTeamId) {
    return [];
  }

  return apiFootball(
    `/fixtures/headtohead?h2h=${homeTeamId}-${awayTeamId}&last=5`
  );
}

async function getLastMatches(
  teamId: string | null
) {
  if (!teamId) return [];

  return apiFootball(
    `/fixtures?team=${teamId}&last=5`
  );
}

async function getUpcomingMatches(
  teamId: string | null,
  next = 12
) {
  if (!teamId) return [];

  return apiFootball(
    `/fixtures?team=${teamId}&next=${next}`
  );
}

async function getInjuries(
  fixtureId: string | null
) {
  if (!fixtureId) return [];

  return apiFootball(
    `/injuries?fixture=${fixtureId}`
  );
}

async function getLineups(
  fixtureId: string | null,
  homeTeamId?: string | null,
  awayTeamId?: string | null
) {
  if (!fixtureId) return [];

  const data = await apiFootball(
    `/fixtures/lineups?fixture=${fixtureId}`
  );

  const lineups = (Array.isArray(data) ? data : []).map(normalizeTeamLineup);

  return orderLineupsForFixture(lineups, homeTeamId, awayTeamId);
}

async function getWeather(
  city: string | null
) {
  if (!city) return null;

  const apiKey =
    process.env.OPENWEATHER_API_KEY;

  if (!apiKey) return null;

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
        city
      )}&appid=${apiKey}&units=metric&lang=sv`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) return null;

    const data = await response.json();

    return {
      city,
      temperature: data.main?.temp,
      description:
        data.weather?.[0]?.description,
      wind: data.wind?.speed,
      humidity: data.main?.humidity,
    };
  } catch (error) {
    console.error(
      "Vädret kunde inte hämtas:",
      error
    );

    return null;
  }
}

async function getOdds(fixtureId: string | null) {
  if (!fixtureId) return [];

  return apiFootball(`/odds?fixture=${fixtureId}`);
}

async function getPlayerStats(
  playerId: string | null,
  leagueId: string,
  season: string
) {
  if (!playerId) return null;

  const data = await apiFootball(
    `/players?id=${playerId}&season=${season}&league=${leagueId}`
  );

  return data?.[0] || null;
}

function calculateFairOdds(
  probability: number
) {
  const safeProbability = Math.min(
    99,
    Math.max(1, probability)
  );

  return Number(
    (100 / safeProbability).toFixed(2)
  );
}

function getBrainPickLimit(
  plan: UserPlan
) {
  if (plan === "elite") return 5;
  if (plan === "pro") return 3;

  return 1;
}

function normalizeRiskLevel(
  value: unknown,
  probability: number
): "Low" | "Medium" | "High" {
  if (
    value === "Low" ||
    value === "Medium" ||
    value === "High"
  ) {
    return value;
  }

  if (probability >= 70) return "Low";
  if (probability >= 50) return "Medium";

  return "High";
}

function safeAnalysis(
  analysis: any,
  brainPickLimit: number
) {
  const rawPicks = Array.isArray(
    analysis?.brainPicks
  )
    ? analysis.brainPicks
    : analysis?.brainPick
      ? [analysis.brainPick]
      : [];

  const brainPicks: BrainPick[] =
    rawPicks
      .slice(0, brainPickLimit)
      .map(
        (
          pick: any,
          index: number
        ) => {
          const rawProbability =
            Number(
              pick?.probability ??
                pick?.confidence ??
                60
            );

          const probability =
            Number.isFinite(
              rawProbability
            )
              ? Math.min(
                  99,
                  Math.max(
                    1,
                    rawProbability
                  )
                )
              : 60;

          return {
            id: index + 1,

            market:
              pick?.market ||
              `Brain Pick ${index + 1}`,

            probability,

            estimatedOdds:
              calculateFairOdds(
                probability
              ),

            riskLevel:
              normalizeRiskLevel(
                pick?.riskLevel,
                probability
              ),

            reason:
              pick?.reason ||
              "Ingen tydlig motivering tillgänglig.",
          };
        }
      );

  if (brainPicks.length === 0) {
    brainPicks.push({
      id: 1,
      market:
        "Ingen tydlig Brain Pick",
      probability: 60,
      estimatedOdds:
        calculateFairOdds(60),
      riskLevel: "Medium",
      reason:
        "AI kunde inte välja ett tydligt alternativ.",
    });
  }

  const firstPick = brainPicks[0];

  return {
    summary:
      analysis?.summary ||
      "Ingen sammanfattning.",

    strengths: Array.isArray(
      analysis?.strengths
    )
      ? analysis.strengths
      : [],

    risks: Array.isArray(
      analysis?.risks
    )
      ? analysis.risks
      : [],

    recommendation:
      analysis?.recommendation ||
      "Ingen rekommendation tillgänglig.",

    worthBetting: analysis?.worthBetting,

    brainScore: Number(
      analysis?.brainScore || 75
    ),

    riskLevel:
      analysis?.riskLevel || "Medium",

    confidence: Number(
      analysis?.confidence || 75
    ),

    scoreBreakdown:
      analysis?.scoreBreakdown || {
        form: 10,
        table: 10,
        h2h: 10,
        stats: 15,
        market: 15,
        confidence: 15,
      },

    brainPicks,

    brainPick: {
      market: firstPick.market,
      confidence:
        firstPick.probability,
      reason: firstPick.reason,
    },
  };
}

function parseAIResponse(
  content: string,
  language: ReturnType<typeof parseRequestLanguage>
) {
  const messages = getAnalyzeApiMessages(language);
  const cleaned = content
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    return {
      summary: content,

      strengths: [messages.parseFallbackStrength],

      risks: [messages.parseFallbackRisk],

      recommendation: messages.parseFallbackRecommendation,

      brainPicks: [],
    };
  }
}

export async function POST(
  req: Request
) {
  const requestBody = await req.json().catch(() => ({}));
  const language = parseRequestLanguage(requestBody?.language);
  const messages = getAnalyzeApiMessages(language);

  try {
    const authHeader =
      req.headers.get("authorization");

    const token =
      authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7)
        : null;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: messages.mustLogin,
        },
        {
          status: 401,
        }
      );
    }

    const {
      data: { user },
      error: authError,
    } =
      await supabaseAdmin.auth.getUser(
        token
      );

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: messages.authFailed,
        },
        {
          status: 401,
        }
      );
    }

    const userId = user.id;

    let userPlan: UserPlan =
      "free";

    const {
      data: profile,
      error: profileError,
    } = await supabaseAdmin
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.error(
        "Kunde inte hämta användarplan:",
        profileError
      );
    }

    if (
      profile?.plan === "free" ||
      profile?.plan === "pro" ||
      profile?.plan === "elite"
    ) {
      userPlan = profile.plan;
    }

    const brainPickLimit =
      getBrainPickLimit(userPlan);

    const text =
      typeof requestBody?.text === "string"
        ? requestBody.text.trim()
        : "";

    if (!text) {
      return NextResponse.json(
        {
          success: false,
          error: messages.noBetIdea,
        },
        {
          status: 400,
        }
      );
    }

    if (userPlan === "free") {
      const today = new Date();

      today.setHours(0, 0, 0, 0);

      const {
        count,
        error: countError,
      } = await supabaseAdmin
        .from("analyses")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("user_id", userId)
        .gte(
          "created_at",
          today.toISOString()
        );

      if (countError) {
        console.error(
          "Kunde inte räkna dagens analyser:",
          countError
        );
      }

      if ((count ?? 0) >= 3) {
        return NextResponse.json(
          {
            success: false,
            premiumRequired: true,
            error: messages.freeLimit,
          },
          {
            status: 403,
          }
        );
      }
    }

    const homeTeamId =
      extractNumber(
        text,
        "Home Team ID"
      );

    const awayTeamId =
      extractNumber(
        text,
        "Away Team ID"
      );

    const fixtureId =
      extractNumber(
        text,
        "Fixture ID"
      );

    const playerId =
      extractNumber(
        text,
        "Player ID"
      );

    const fixture =
      await getFixture(fixtureId);

    const leagueId = String(
      fixture?.league?.id || 39
    );

    const season = String(
      fixture?.league?.season ||
        new Date().getFullYear()
    );

    const [
      homeStats,
      awayStats,
      standings,
      h2h,
      homeLastMatches,
      awayLastMatches,
      injuries,
      weather,
      playerStats,
      lineups,
      oddsResponse,
    ] = await Promise.all([
      getTeamStats(
        homeTeamId,
        leagueId,
        season
      ),

      getTeamStats(
        awayTeamId,
        leagueId,
        season
      ),

      getStandings(
        leagueId,
        season
      ),

      getH2H(
        homeTeamId,
        awayTeamId
      ),

      getLastMatches(homeTeamId),

      getLastMatches(awayTeamId),

      getInjuries(fixtureId),

      getWeather(
        fixture?.fixture?.venue?.city ||
          fixture?.teams?.home?.name ||
          null
      ),

      getPlayerStats(
        playerId,
        leagueId,
        season
      ),

      getLineups(fixtureId, homeTeamId, awayTeamId),
      getOdds(fixtureId),
    ]);

    const homeName = fixture?.teams?.home?.name ?? "";
    const awayName = fixture?.teams?.away?.name ?? "";
    const betSides = resolveBetSides(text, homeName, awayName);
    const betTeams: Array<{ id: number; name: string }> = [];

    if (betSides.has("home") && homeTeamId) {
      betTeams.push({
        id: Number(homeTeamId),
        name: homeName || "Home",
      });
    }

    if (betSides.has("away") && awayTeamId) {
      betTeams.push({
        id: Number(awayTeamId),
        name: awayName || "Away",
      });
    }

    const upcomingLists = await Promise.all(
      betTeams.map((team) =>
        getUpcomingMatches(String(team.id), 12)
      )
    );

    const upcomingFixturesByTeam = new Map<number, any[]>();

    betTeams.forEach((team, index) => {
      upcomingFixturesByTeam.set(
        team.id,
        upcomingLists[index] || []
      );
    });

    const rotationRisks = fixture
      ? findRotationRisks({
          currentFixture: fixture,
          upcomingFixturesByTeam,
          recentFixturesByTeam: new Map([
            ...(homeTeamId && betSides.has("home")
              ? [[Number(homeTeamId), homeLastMatches] as const]
              : []),
            ...(awayTeamId && betSides.has("away")
              ? [[Number(awayTeamId), awayLastMatches] as const]
              : []),
          ]),
          betTeams,
        })
      : [];

    const scheduleContext = getScheduleContextStatus({
      hasFixture: Boolean(fixture),
      betTeams,
      rotationRisks,
    });

    const isPlayerProp = Boolean(playerId);
    const playerLineupStatus = playerId
      ? getPlayerLineupStatus(playerId, lineups)
      : null;
    const confirmedLineups = areLineupsConfirmed(lineups);

    const homeStanding =
      standings.find(
        (item: any) =>
          String(item.team?.id) ===
          String(homeTeamId)
      );

    const awayStanding =
      standings.find(
        (item: any) =>
          String(item.team?.id) ===
          String(awayTeamId)
      );

    const homeForm = summarizeRecentForm(
      homeLastMatches,
      homeTeamId,
      homeName || "Home",
      language
    );

    const awayForm = summarizeRecentForm(
      awayLastMatches,
      awayTeamId,
      awayName || "Away",
      language
    );

    const dataQuality = assessDataQuality({
      fixture,
      homeStanding,
      awayStanding,
      homeForm,
      awayForm,
      homeStats,
      awayStats,
      h2h,
      injuries,
      lineups,
      weather,
      oddsResponse,
      language,
    });

    const structuredContext = buildStructuredAnalysisContext({
      fixture,
      homeStanding,
      awayStanding,
      homeForm,
      awayForm,
      homeStats,
      awayStats,
      h2h,
      homeLastMatches,
      awayLastMatches,
      injuries,
      weather,
      oddsResponse,
      dataQuality,
      language,
    });

    const calibrationNote = await getTrackRecordCalibrationNote(language);

    const calculatedScore =
      calculateEnhancedBrainScore({
        homeStanding,
        awayStanding,
        homeForm,
        awayForm,
        homeStats,
        awayStats,
        h2h,
        injuries,
        weather,
        playerStats,
        lineups,
        isPlayerProp,
        playerLineupStatus,
        dataQuality,
      });

    const completion =
      await openai.chat.completions.create({
        model: "gpt-4.1-mini",

        temperature: 0.25,

        response_format: {
          type: "json_object",
        },

        messages: [
          {
            role: "system",
            content: buildAnalyzeSystemPrompt(language),
          },

          {
            role: "user",
            content: buildAnalyzeUserPrompt(language, {
              text,
              fixture,
              userPlan,
              brainPickLimit,
              lineups,
              homeStanding,
              awayStanding,
              homeStats,
              awayStats,
              h2h,
              homeLastMatches,
              awayLastMatches,
              injuries,
              playerStats,
              playerId,
              rotationRisks,
              playerLineupStatus,
              structuredContext,
              dataQualityNote: dataQuality.note,
              calibrationNote,
            }),
          },
        ],
      });

    const content =
      completion.choices[0]
        ?.message?.content || "{}";

    const parsedAnalysis = parseAIResponse(content, language);

    const aiAnalysis =
      safeAnalysis(
        parsedAnalysis,
        brainPickLimit
      );

    const guardedAnalysis = applyAnalysisSafetyGuardrails(
      aiAnalysis,
      {
        language,
        dataQuality,
        oddsResponse,
      }
    );

    const cleanAnalysis = {
      ...guardedAnalysis,

      brainScore:
        calculatedScore.brainScore,

      riskLevel:
        calculatedScore.riskLevel,

      confidence:
        calculatedScore.confidence,

      scoreBreakdown:
        calculatedScore.scoreBreakdown,
    };

    const worthBettingFallback = deriveWorthBettingFallback(
      {
        brainScore: cleanAnalysis.brainScore,
        riskLevel: cleanAnalysis.riskLevel,
        dataQualityTier: dataQuality.tier,
      },
      language
    );

    const worthBetting: WorthBetting = applyWorthBettingGuardrails(
      normalizeWorthBetting(
        parsedAnalysis?.worthBetting ??
          (guardedAnalysis as { worthBetting?: unknown }).worthBetting,
        worthBettingFallback
      ),
      {
        dataQualityTier: dataQuality.tier,
        language,
      }
    );

    const finalAnalysis = {
      ...cleanAnalysis,
      worthBetting,
    };

    const lines = text
      .split("\n")
      .map(
        (line: string) =>
          line.trim()
      )
      .filter(Boolean);

    const match = lines[0] || messages.unknownMatch;

    const markets = lines.slice(1);

    const analysisInsertBase = {
      user_id: userId,
      match,
      markets,
      score: finalAnalysis.brainScore,
      risk: finalAnalysis.riskLevel,
      confidence: finalAnalysis.confidence,
      summary: finalAnalysis.summary,
      strengths: finalAnalysis.strengths,
      risks: finalAnalysis.risks,
      recommendation: finalAnalysis.recommendation,
      brain_picks: finalAnalysis.brainPicks,
    };

    let inserted = null;
    let insertError: { message: string } | null = null;

    const insertWithWorthBetting = await supabaseAdmin
      .from("analyses")
      .insert({
        ...analysisInsertBase,
        worth_betting: finalAnalysis.worthBetting,
      })
      .select();

    if (
      insertWithWorthBetting.error &&
      /worth_betting|schema cache/i.test(insertWithWorthBetting.error.message)
    ) {
      console.warn(
        "worth_betting column missing — saving analysis without it. Run Supabase migration 20260721190000_analyses_worth_betting.sql"
      );

      const insertWithoutWorthBetting = await supabaseAdmin
        .from("analyses")
        .insert(analysisInsertBase)
        .select();

      inserted = insertWithoutWorthBetting.data;
      insertError = insertWithoutWorthBetting.error;
    } else {
      inserted = insertWithWorthBetting.data;
      insertError = insertWithWorthBetting.error;
    }

    const usedData = {
      fixtureId,
      homeTeamId,
      awayTeamId,
      leagueId,
      season,

      hasFixture: Boolean(fixture),

      hasHomeStats: Boolean(homeStats),

      hasAwayStats: Boolean(awayStats),

      hasStandings: standings.length > 0,

      hasH2H: h2h.length > 0,

      hasHomeLastMatches: homeLastMatches.length > 0,

      hasAwayLastMatches: awayLastMatches.length > 0,

      hasInjuries: injuries.length > 0,

      hasLineups: lineups.length > 0,

      confirmedLineups,

      playerLineupStatus,

      lastMatches: {
        home: homeLastMatches,
        away: awayLastMatches,
      },

      injuries,
      lineups,
      weather,
      oddsAvailable: oddsResponse.length > 0,
      dataQuality,

      referee: fixture?.fixture?.referee || null,

      rotationRisks,
      scheduleContext,
      scheduleTeamsChecked: betTeams.map((team) => team.name),
    };

    if (insertError) {
      console.error(
        "Kunde inte spara analysen:",
        insertError
      );

      return NextResponse.json({
        success: true,
        userPlan,
        brainPickLimit,
        saved: null,
        saveWarning: insertError.message,
        usedData,
        analysis: finalAnalysis,
      });
    }

    const primaryPick = finalAnalysis.brainPicks[0];

    if (fixtureId && primaryPick?.market) {
      void insertPublicTrackPick({
        sourceType: "analysis",
        sourceRef: inserted?.[0]?.id ? String(inserted[0].id) : undefined,
        fixtureId: Number(fixtureId),
        matchLabel: match,
        market: primaryPick.market,
        brainScore: finalAnalysis.brainScore,
        safetyTier: brainScoreToSafetyTier(finalAnalysis.brainScore),
        probability: primaryPick.probability,
        kickoffAt: fixture?.fixture?.date || null,
        note:
          language === "en"
            ? "Featured Brain Pick from user analysis"
            : "Utvalt Brain Pick från användaranalys",
      });
    }

    return NextResponse.json({
      success: true,
      userPlan,
      brainPickLimit,
      saved: inserted,
      usedData,
      analysis: finalAnalysis,
    });
  } catch (error: unknown) {
    console.error(
      "ANALYZE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}