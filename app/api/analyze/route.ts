import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

async function getInjuries(
  fixtureId: string | null
) {
  if (!fixtureId) return [];

  return apiFootball(
    `/injuries?fixture=${fixtureId}`
  );
}

async function getLineups(
  fixtureId: string | null
) {
  if (!fixtureId) return [];

  const data = await apiFootball(
    `/fixtures/lineups?fixture=${fixtureId}`
  );

  return (Array.isArray(data) ? data : []).map(
    (teamLineup: any) => ({
      team: {
        id: teamLineup.team?.id,
        name: teamLineup.team?.name,
        logo: teamLineup.team?.logo,
      },

      formation:
        teamLineup.formation || null,

      coach: {
        id: teamLineup.coach?.id,
        name: teamLineup.coach?.name,
        photo: teamLineup.coach?.photo,
      },

      startXI: (
        teamLineup.startXI || []
      ).map((item: any) => ({
        id: item.player?.id,
        name: item.player?.name,
        number: item.player?.number,
        position: item.player?.pos,
        grid: item.player?.grid,
      })),

      substitutes: (
        teamLineup.substitutes || []
      ).map((item: any) => ({
        id: item.player?.id,
        name: item.player?.name,
        number: item.player?.number,
        position: item.player?.pos,
        grid: item.player?.grid,
      })),
    })
  );
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

function summarizePlayerStats(player: any) {
  if (!player) {
    return "Ingen spelarstatistik tillgänglig.";
  }

  const stats = player.statistics?.[0];

  if (!stats) {
    return "Ingen spelarstatistik tillgänglig.";
  }

  return `
Spelare: ${player.player?.name || "Okänd"}
Position: ${player.player?.position || "Okänd"}
Matcher: ${stats.games?.appearences ?? "Saknas"}
Starter: ${stats.games?.lineups ?? "Saknas"}
Minuter: ${stats.games?.minutes ?? "Saknas"}
Mål: ${stats.goals?.total ?? "Saknas"}
Assist: ${stats.goals?.assists ?? "Saknas"}
Skott: ${stats.shots?.total ?? "Saknas"}
Skott på mål: ${stats.shots?.on ?? "Saknas"}
Passningsprocent: ${stats.passes?.accuracy ?? "Saknas"}
Betyg: ${stats.games?.rating ?? "Saknas"}
`;
}

function summarizeLineups(lineups: any[]) {
  if (
    !Array.isArray(lineups) ||
    lineups.length < 2
  ) {
    return (
      "Bekräftade startelvor är ännu inte " +
      "publicerade."
    );
  }

  return lineups
    .map((lineup) => {
      const players = (
        lineup.startXI || []
      )
        .map(
          (player: any) =>
            `${player.number ?? "-"} ${
              player.name || "Okänd spelare"
            } (${player.position || "-"})`
        )
        .join(", ");

      return `
Lag: ${lineup.team?.name || "Okänt lag"}
Formation: ${lineup.formation || "Ej angiven"}
Tränare: ${lineup.coach?.name || "Ej angiven"}
Startelva: ${players || "Ej tillgänglig"}
`;
    })
    .join("\n");
}

function calculateBrainScore(input: {
  homeStanding: any;
  awayStanding: any;
  h2h: any[];
  injuries: any[];
  weather: any;
  playerStats: any;
  lineups: any[];
  isPlayerProp: boolean;
}) {
  let score = 50;

  const breakdown = {
    form: 10,
    table: 10,
    h2h: 10,
    stats: 10,
    market: 10,
    confidence: 10,
  };

  if (
    input.homeStanding &&
    input.awayStanding
  ) {
    const rankDiff =
      Number(
        input.awayStanding.rank || 0
      ) -
      Number(
        input.homeStanding.rank || 0
      );

    if (rankDiff > 5) {
      score += 8;
      breakdown.table = 18;
    }
  }

  if (input.h2h.length > 0) {
    score += 5;
    breakdown.h2h = 15;
  }

  if (
    input.playerStats &&
    input.isPlayerProp
  ) {
    score += 12;
    breakdown.stats = 22;
    breakdown.market = 18;
  }

  if (input.lineups.length >= 2) {
    score += 3;
    breakdown.confidence = 15;
  }

  if (input.injuries.length > 0) {
    score -= Math.min(
      input.injuries.length * 2,
      10
    );
  }

  if (input.weather) {
    score += 2;
    breakdown.confidence = Math.max(
      breakdown.confidence,
      12
    );
  }

  const brainScore = Math.max(
    0,
    Math.min(100, score)
  );

  const riskLevel =
    brainScore >= 80
      ? "Low"
      : brainScore < 60
        ? "High"
        : "Medium";

  return {
    brainScore,
    riskLevel,
    confidence: Math.min(
      95,
      Math.max(40, brainScore + 5)
    ),
    scoreBreakdown: breakdown,
  };
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
  content: string
) {
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

      strengths: [
        "AI kunde genomföra analysen.",
      ],

      risks: [
        "AI-svaret kunde inte struktureras helt.",
      ],

      recommendation:
        "Kontrollera analysen kritiskt.",

      brainPicks: [],
    };
  }
}

export async function POST(
  req: Request
) {
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
          error:
            "Du måste vara inloggad för att skapa en analys.",
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
          error:
            "Inloggningen kunde inte verifieras.",
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

    const requestBody =
      await req.json();

    const text =
      typeof requestBody?.text ===
      "string"
        ? requestBody.text.trim()
        : "";

    if (!text) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Ingen spelidé skickades.",
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
            error:
              "Free-planen tillåter 3 analyser per dag. Uppgradera till Pro för obegränsade analyser.",
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

      getLineups(fixtureId),
    ]);

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

    const calculatedScore =
      calculateBrainScore({
        homeStanding,
        awayStanding,
        h2h,
        injuries,
        weather,
        playerStats,
        lineups,
        isPlayerProp:
          Boolean(playerId),
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
            content:
              "Du är Brain Engine, AI-motorn bakom BrainStats. Analysera fotboll objektivt och datadrivet. Lova aldrig resultat, kalla aldrig ett spel säkert och uppmuntra aldrig oansvarigt spelande. Använd endast data som finns i underlaget och säg tydligt när data saknas. Svara endast med giltig JSON.",
          },

          {
            role: "user",
            content: `
Analysera följande fotbollsidé:

${text}

Match:
${fixture?.teams?.home?.name || "Hemmalag"} - ${
              fixture?.teams?.away
                ?.name || "Bortalag"
            }

Liga:
${fixture?.league?.name || "Okänd liga"}

Datum:
${fixture?.fixture?.date || "Okänt datum"}

Arena:
${
  fixture?.fixture?.venue?.name ||
  "Ej tillgänglig"
}

Användarplan:
${userPlan}

Skapa exakt ${brainPickLimit} olika Brain Picks.

Free får 1 förslag.
Pro får 3 förslag.
Elite får 5 förslag.

Varje Brain Pick måste innehålla:
- market
- probability som heltal mellan 1 och 99
- riskLevel: Low, Medium eller High
- reason med minst två konkreta datapunkter

Om den valda marknaden gäller en spelare ska förslagen fokusera på samma spelare och samma typ av spelarmarknad.

Bekräftade startelvor:
${summarizeLineups(lineups)}

Viktigt om startelvor:
- Om startelvor finns ska de användas i analysen.
- Nämn om viktiga spelare startar eller saknas.
- Om en vald spelare inte startar ska det tydligt påverka risk och sannolikhet.
- Om startelvor saknas får du inte gissa vilka som startar.

Tabell hemmalag:
${JSON.stringify(
  homeStanding || null,
  null,
  2
)}

Tabell bortalag:
${JSON.stringify(
  awayStanding || null,
  null,
  2
)}

Hemmalag statistik:
${JSON.stringify(
  homeStats,
  null,
  2
)}

Bortalag statistik:
${JSON.stringify(
  awayStats,
  null,
  2
)}

Head-to-head:
${JSON.stringify(h2h, null, 2)}

Hemmalag senaste fem:
${JSON.stringify(
  homeLastMatches,
  null,
  2
)}

Bortalag senaste fem:
${JSON.stringify(
  awayLastMatches,
  null,
  2
)}

Skador och frånvaro:
${JSON.stringify(
  injuries,
  null,
  2
)}

Spelarstatistik:
${summarizePlayerStats(
  playerStats
)}

Svara i exakt denna JSON-struktur:

{
  "summary": "Professionell sammanfattning",
  "strengths": [
    "styrka 1",
    "styrka 2",
    "styrka 3"
  ],
  "risks": [
    "risk 1",
    "risk 2",
    "risk 3"
  ],
  "recommendation": "Neutral rekommendation",
  "brainScore": 75,
  "riskLevel": "Medium",
  "confidence": 75,
  "scoreBreakdown": {
    "form": 15,
    "table": 15,
    "h2h": 10,
    "stats": 20,
    "market": 15,
    "confidence": 10
  },
  "brainPicks": [
    {
      "market": "Förslagets marknad",
      "probability": 64,
      "riskLevel": "Medium",
      "reason": "Motivering med minst två konkreta datapunkter"
    }
  ]
}
`,
          },
        ],
      });

    const content =
      completion.choices[0]
        ?.message?.content || "{}";

    const parsedAnalysis =
      parseAIResponse(content);

    const aiAnalysis =
      safeAnalysis(
        parsedAnalysis,
        brainPickLimit
      );

    const cleanAnalysis = {
      ...aiAnalysis,

      brainScore:
        calculatedScore.brainScore,

      riskLevel:
        calculatedScore.riskLevel,

      confidence:
        calculatedScore.confidence,

      scoreBreakdown:
        calculatedScore.scoreBreakdown,
    };

    const lines = text
      .split("\n")
      .map(
        (line: string) =>
          line.trim()
      )
      .filter(Boolean);

    const match =
      lines[0] || "Okänd match";

    const markets = lines.slice(1);

    const {
      data: inserted,
      error: insertError,
    } = await supabaseAdmin
      .from("analyses")
      .insert({
        user_id: userId,
        match,
        markets,

        score:
          cleanAnalysis.brainScore,

        risk:
          cleanAnalysis.riskLevel,

        confidence:
          cleanAnalysis.confidence,

        summary:
          cleanAnalysis.summary,

        strengths:
          cleanAnalysis.strengths,

        risks:
          cleanAnalysis.risks,

        recommendation:
          cleanAnalysis.recommendation,

        brain_picks:
          cleanAnalysis.brainPicks,
      })
      .select();

    if (insertError) {
      console.error(
        "Kunde inte spara analysen:",
        insertError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            insertError.message,
          analysis:
            cleanAnalysis,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      userPlan,
      brainPickLimit,
      saved: inserted,

      usedData: {
        fixtureId,
        homeTeamId,
        awayTeamId,
        leagueId,
        season,

        hasFixture:
          Boolean(fixture),

        hasHomeStats:
          Boolean(homeStats),

        hasAwayStats:
          Boolean(awayStats),

        hasStandings:
          standings.length > 0,

        hasH2H:
          h2h.length > 0,

        hasHomeLastMatches:
          homeLastMatches.length > 0,

        hasAwayLastMatches:
          awayLastMatches.length > 0,

        hasInjuries:
          injuries.length > 0,

        hasLineups:
          lineups.length >= 2,

        confirmedLineups:
          lineups.length >= 2,

        lastMatches: {
          home: homeLastMatches,
          away: awayLastMatches,
        },

        injuries,
        lineups,
        weather,

        referee:
          fixture?.fixture?.referee ||
          null,
      },

      analysis: cleanAnalysis,
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