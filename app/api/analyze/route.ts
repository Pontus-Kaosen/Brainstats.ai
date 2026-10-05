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
import { insertAnalysisWithFallback } from "@/lib/analysisInsert";
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
import {
  extractBetBlocks,
  extractNumberFromBlock,
  getMarketsFromBlock,
  getMatchLabelFromBlock,
} from "@/lib/betTextParser";
import {
  filterActiveSidelined,
  isMatchStarted,
  mergeAbsences,
  pickFinishedFixtureIds,
  slimFixtureEvents,
  slimFixtureStatistics,
  slimLeagueLeaders,
  slimPrediction,
  slimSeasonStats,
} from "@/lib/apiFootballEnrichment";

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
  return extractNumberFromBlock(text, label);
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T) => Promise<R>
) {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const current = nextIndex;
      nextIndex += 1;
      results[current] = await mapper(items[current]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker())
  );

  return results;
}

type AnalyzeBlockOptions = {
  userPlan: UserPlan;
  brainPickLimit: number;
  language: ReturnType<typeof parseRequestLanguage>;
  messages: ReturnType<typeof getAnalyzeApiMessages>;
};

async function analyzeSingleMatchBlock(
  blockText: string,
  options: AnalyzeBlockOptions
) {
  const { userPlan, brainPickLimit, language, messages } = options;
  const text = blockText;

  const homeTeamId = extractNumber(text, "Home Team ID");
  const awayTeamId = extractNumber(text, "Away Team ID");
  const fixtureId = extractNumber(text, "Fixture ID");
  const playerId = extractNumber(text, "Player ID");

  const calibrationPromise = getTrackRecordCalibrationNote(language);

  const [
    fixture,
    h2h,
    homeLastMatches,
    awayLastMatches,
    fixtureInjuries,
    lineups,
    oddsResponse,
    predictionRaw,
    homeSidelinedRaw,
    awaySidelinedRaw,
  ] = await Promise.all([
    getFixture(fixtureId),
    getH2H(homeTeamId, awayTeamId),
    getLastMatches(homeTeamId),
    getLastMatches(awayTeamId),
    getInjuries(fixtureId),
    getLineups(fixtureId, homeTeamId, awayTeamId),
    getOdds(fixtureId),
    getPredictions(fixtureId),
    getSidelined(homeTeamId),
    getSidelined(awayTeamId),
  ]);

  const leagueId = String(fixture?.league?.id || 39);

  const season = String(
    fixture?.league?.season || new Date().getFullYear()
  );

  const matchStarted = isMatchStarted(fixture);
  const recentFixtureIds = [
    ...new Set([
      ...pickFinishedFixtureIds(homeLastMatches, 2),
      ...pickFinishedFixtureIds(awayLastMatches, 2),
    ]),
  ];
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

  const homeRecentFixtureId = pickFinishedFixtureIds(homeLastMatches, 1)[0];
  const awayRecentFixtureId = pickFinishedFixtureIds(awayLastMatches, 1)[0];

  const [
    [
      homeStats,
      awayStats,
      standings,
      weather,
      playerStats,
      topScorersRaw,
      topAssistsRaw,
    ],
    [liveStatisticsRaw, liveEventsRaw, ...recentStatisticsRaw],
    upcomingLists,
    [homeCoach, awayCoach, homeMatchPlayers, awayMatchPlayers],
  ] = await Promise.all([
    Promise.all([
      getTeamStats(homeTeamId, leagueId, season),
      getTeamStats(awayTeamId, leagueId, season),
      getStandings(leagueId, season),
      getWeather(
        fixture?.fixture?.venue?.city || null,
        fixture?.league?.country || null
      ),
      getPlayerStats(playerId, leagueId, season),
      getTopScorers(leagueId, season),
      getTopAssists(leagueId, season),
    ]),
    Promise.all([
      matchStarted ? getFixtureStatistics(fixtureId) : Promise.resolve([]),
      matchStarted ? getFixtureEvents(fixtureId) : Promise.resolve([]),
      ...recentFixtureIds.map((id) => getFixtureStatistics(String(id))),
    ]),
    Promise.all(
      betTeams.map((team) => getUpcomingMatches(String(team.id), 12))
    ),
    Promise.all([
      getCoach(homeTeamId),
      getCoach(awayTeamId),
      getMatchPlayers(
        homeRecentFixtureId ? String(homeRecentFixtureId) : null
      ),
      getMatchPlayers(
        awayRecentFixtureId ? String(awayRecentFixtureId) : null
      ),
    ]),
  ]);

  const injuries = mergeAbsences(fixtureInjuries, [
    ...(homeTeamId
      ? filterActiveSidelined(homeSidelinedRaw, {
          id: Number(homeTeamId),
          name: fixture?.teams?.home?.name || "Home",
        })
      : []),
    ...(awayTeamId
      ? filterActiveSidelined(awaySidelinedRaw, {
          id: Number(awayTeamId),
          name: fixture?.teams?.away?.name || "Away",
        })
      : []),
  ]);

  const prediction = slimPrediction(predictionRaw);
  const fixtureStatistics = slimFixtureStatistics(liveStatisticsRaw);
  const fixtureEvents = slimFixtureEvents(liveEventsRaw);
  const recentMatchStats = recentFixtureIds.map((id, index) => ({
    fixtureId: id,
    stats: slimFixtureStatistics(recentStatisticsRaw[index] || []),
  }));
  const topScorers = slimLeagueLeaders(topScorersRaw, "goals");
  const topAssists = slimLeagueLeaders(topAssistsRaw, "assists");

  const upcomingFixturesByTeam = new Map<number, any[]>();

  betTeams.forEach((team, index) => {
    upcomingFixturesByTeam.set(team.id, upcomingLists[index] || []);
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

  const homeStanding = standings.find(
    (item: any) => String(item.team?.id) === String(homeTeamId)
  );

  const awayStanding = standings.find(
    (item: any) => String(item.team?.id) === String(awayTeamId)
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
    prediction,
    fixtureStatistics,
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
    prediction,
    fixtureStatistics,
    fixtureEvents,
    recentMatchStats,
    topScorers,
    topAssists,
    homeCoach,
    awayCoach,
    homeMatchPlayers,
    awayMatchPlayers,
    dataQuality,
    language,
  });

  const calibrationNote = await calibrationPromise;

  const calculatedScore = calculateEnhancedBrainScore({
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
    prediction,
  });

  const completion = await openai.chat.completions.create({
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

  const content = completion.choices[0]?.message?.content || "{}";

  const parsedAnalysis = parseAIResponse(content, language);

  const aiAnalysis = safeAnalysis(parsedAnalysis, brainPickLimit);

  const guardedAnalysis = applyAnalysisSafetyGuardrails(aiAnalysis, {
    language,
    dataQuality,
    oddsResponse,
  });

  const cleanAnalysis = {
    ...guardedAnalysis,
    brainScore: calculatedScore.brainScore,
    riskLevel: calculatedScore.riskLevel,
    confidence: calculatedScore.confidence,
    scoreBreakdown: calculatedScore.scoreBreakdown,
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

  const matchLabel = getMatchLabelFromBlock(text) || messages.unknownMatch;
  const markets = getMarketsFromBlock(text);

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
      home: slimMatches(homeLastMatches),
      away: slimMatches(awayLastMatches),
    },
    homeLastMatches: slimMatches(homeLastMatches),
    awayLastMatches: slimMatches(awayLastMatches),
    injuries,
    lineups,
    h2h: slimMatches(h2h),
    headToHead: slimMatches(h2h),
    homeStanding: slimStanding(standings, homeTeamId),
    awayStanding: slimStanding(standings, awayTeamId),
    homeSeason: slimSeasonStats(homeStats),
    awaySeason: slimSeasonStats(awayStats),
    weather,
    oddsAvailable: oddsResponse.length > 0,
    prediction,
    fixtureStatistics,
    fixtureEvents,
    recentMatchStats,
    topScorers,
    topAssists,
    dataQuality,
    referee: fixture?.fixture?.referee || null,
    fixtureDate: fixture?.fixture?.date || null,
    homeCoach,
    awayCoach,
    homeMatchHighlights: slimPlayerHighlights(homeMatchPlayers, homeTeamId),
    awayMatchHighlights: slimPlayerHighlights(awayMatchPlayers, awayTeamId),
    rotationRisks,
    scheduleContext,
    scheduleTeamsChecked: betTeams.map((team) => team.name),
  };

  return {
    matchLabel,
    markets,
    blockText: text,
    finalAnalysis,
    usedData,
    fixtureId,
    fixture,
  };
}

type PlayerHighlight = {
  name: string;
  rating: string | null;
  goals: number;
  assists: number;
  minutes: number;
};

function slimPlayerHighlights(squads: any[], teamId: string | null) {
  const block = (Array.isArray(squads) ? squads : []).find(
    (item) => teamId && String(item?.team?.id) === String(teamId)
  );
  const players = Array.isArray(block?.players) ? block.players : [];

  const rows: Array<PlayerHighlight | null> = players.map((item: any) => {
    const stats = item?.statistics?.[0];
    const minutes = Number(stats?.games?.minutes ?? 0);

    if (!minutes || !item?.player?.name) return null;

    return {
      name: String(item.player.name),
      rating: stats?.games?.rating ? String(stats.games.rating) : null,
      goals: Number(stats?.goals?.total ?? 0),
      assists: Number(stats?.goals?.assists ?? 0),
      minutes,
    };
  });

  return rows
    .filter((row): row is PlayerHighlight => row !== null)
    .sort(
      (a, b) =>
        b.goals + b.assists - (a.goals + a.assists) || b.minutes - a.minutes
    )
    .slice(0, 3)
    .map(({ name, rating, goals, assists }) => ({
      name,
      rating,
      goals,
      assists,
    }));
}

const FOOTBALL_FETCH_TIMEOUT_MS = 8000;

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
        signal: AbortSignal.timeout(FOOTBALL_FETCH_TIMEOUT_MS),
        next: { revalidate: 60 },
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

  const data = await apiFootball(
    `/teams/statistics?league=${leagueId}&season=${season}&team=${teamId}`
  );

  return Array.isArray(data) ? data[0] || null : data || null;
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
    `/fixtures/headtohead?h2h=${homeTeamId}-${awayTeamId}&last=8`
  );
}

async function getLastMatches(
  teamId: string | null
) {
  if (!teamId) return [];

  return apiFootball(
    `/fixtures?team=${teamId}&last=8`
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

function slimMatches(items: any[]) {
  return (Array.isArray(items) ? items : [])
    .filter((item) => item?.fixture?.id)
    .slice(0, 8)
    .map((item) => ({
      fixture: {
        id: item.fixture.id,
        date: item.fixture.date,
      },
      teams: {
        home: {
          id: item.teams?.home?.id,
          name: item.teams?.home?.name,
          winner: item.teams?.home?.winner,
        },
        away: {
          id: item.teams?.away?.id,
          name: item.teams?.away?.name,
          winner: item.teams?.away?.winner,
        },
      },
      goals: {
        home: item.goals?.home ?? null,
        away: item.goals?.away ?? null,
      },
    }));
}

function slimStanding(rows: any[], teamId: string | null) {
  if (!teamId || !Array.isArray(rows)) return null;

  const row = rows.find(
    (item) => String(item?.team?.id) === String(teamId)
  );

  if (!row) return null;

  return {
    rank: row.rank,
    points: row.points,
    played: row.all?.played,
    won: row.all?.win,
    draw: row.all?.draw,
    lost: row.all?.lose,
    goalsFor: row.all?.goals?.for,
    goalsAgainst: row.all?.goals?.against,
    form: row.form,
    teamName: row.team?.name,
  };
}

async function getPredictions(fixtureId: string | null) {
  if (!fixtureId) return null;

  const data = await apiFootball(`/predictions?fixture=${fixtureId}`);

  return Array.isArray(data) ? data[0] || null : data || null;
}

async function getFixtureStatistics(fixtureId: string | null) {
  if (!fixtureId) return [];

  return apiFootball(`/fixtures/statistics?fixture=${fixtureId}`);
}

async function getFixtureEvents(fixtureId: string | null) {
  if (!fixtureId) return [];

  return apiFootball(`/fixtures/events?fixture=${fixtureId}`);
}

async function getSidelined(teamId: string | null) {
  if (!teamId) return [];

  return apiFootball(`/sidelined?team=${teamId}`);
}

async function getCoach(teamId: string | null) {
  if (!teamId) return null;

  const data = await apiFootball(`/coachs?team=${teamId}`);
  const coach = Array.isArray(data) ? data[0] : null;

  if (!coach) return null;

  const name =
    coach.name ||
    [coach.firstname, coach.lastname].filter(Boolean).join(" ") ||
    null;

  const current = Array.isArray(coach.career)
    ? coach.career.find(
        (job: any) =>
          !job?.end && String(job?.team?.id) === String(teamId)
      )
    : null;

  return {
    name,
    nationality: coach.nationality || null,
    since: current?.start ? String(current.start).slice(0, 10) : null,
  };
}

async function getMatchPlayers(fixtureId: string | null) {
  if (!fixtureId) return [];

  return apiFootball(`/fixtures/players?fixture=${fixtureId}`);
}

async function getTopScorers(leagueId: string, season: string) {
  return apiFootball(
    `/players/topscorers?league=${leagueId}&season=${season}`
  );
}

async function getTopAssists(leagueId: string, season: string) {
  return apiFootball(
    `/players/topassists?league=${leagueId}&season=${season}`
  );
}

function cleanCityName(value: string) {
  return value.replace(/\s*\([^)]*\)\s*/g, "").split(",")[0].trim();
}

async function getWeather(
  city: string | null,
  country?: string | null
) {
  const apiKey =
    process.env.OPENWEATHER_API_KEY ||
    process.env.OPENWEATHER_API_KEY ||
    process.env.OPENWEATHERMAP_API_KEY;

  if (!apiKey || !city) return null;

  const cleaned = cleanCityName(city);
  if (!cleaned) return null;

  const queries = country
    ? [cleaned, `${cleaned},${country}`]
    : [cleaned];

  for (const query of queries) {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
          query
        )}&appid=${apiKey}&units=metric&lang=sv`,
        {
          signal: AbortSignal.timeout(5000),
          next: { revalidate: 600 },
        }
      );

      if (!response.ok) continue;

      const data = await response.json();
      const temperature =
        data.main?.temp != null ? Math.round(data.main.temp) : undefined;
      const windKmh =
        data.wind?.speed != null
          ? Math.round(Number(data.wind.speed) * 3.6)
          : undefined;
      const description = data.weather?.[0]?.description || undefined;

      return {
        city: cleaned,
        temperature,
        description,
        wind: windKmh,
        humidity: data.main?.humidity ?? undefined,
      };
    } catch (error) {
      console.error("Vädret kunde inte hämtas:", error);
    }
  }

  return null;
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

    const blocks = extractBetBlocks(text);
    const blockOptions = {
      userPlan,
      brainPickLimit,
      language,
      messages,
    };

    const matchResults = await mapWithConcurrency(
      blocks,
      2,
      (block) => analyzeSingleMatchBlock(block, blockOptions)
    );

    const primary = matchResults[0];
    const combinedMatch = matchResults
      .map((result) => result.matchLabel)
      .join(" · ");
    const allMarkets = matchResults.flatMap((result) => result.markets);

    const usedData = {
      ...primary.usedData,
      matchAnalyses: matchResults.map((result) => ({
        matchLabel: result.matchLabel,
        markets: result.markets,
        blockText: result.blockText,
        analysis: result.finalAnalysis,
        usedData: result.usedData,
      })),
    };

    const matches = matchResults.map((result) => ({
      matchLabel: result.matchLabel,
      markets: result.markets,
      blockText: result.blockText,
      analysis: result.finalAnalysis,
      usedData: result.usedData,
    }));

    const analysisInsertBase = {
      user_id: userId,
      match: combinedMatch,
      markets: allMarkets,
      score: primary.finalAnalysis.brainScore,
      risk: primary.finalAnalysis.riskLevel,
      confidence: primary.finalAnalysis.confidence,
      summary: primary.finalAnalysis.summary,
      strengths: primary.finalAnalysis.strengths,
      risks: primary.finalAnalysis.risks,
      recommendation: primary.finalAnalysis.recommendation,
      brain_picks: primary.finalAnalysis.brainPicks,
    };

    const insertResult = await insertAnalysisWithFallback(supabaseAdmin, {
      ...analysisInsertBase,
      worth_betting: primary.finalAnalysis.worthBetting,
      used_data: usedData,
      score_breakdown: primary.finalAnalysis.scoreBreakdown,
      bet_text: text,
    });

    const inserted = insertResult.data;
    const insertError = insertResult.error;

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
        analysis: primary.finalAnalysis,
        matches,
      });
    }

    for (const result of matchResults) {
      const primaryPick = result.finalAnalysis.brainPicks[0];

      if (result.fixtureId && primaryPick?.market) {
        void insertPublicTrackPick({
          sourceType: "analysis",
          sourceRef: inserted?.[0]?.id ? String(inserted[0].id) : undefined,
          fixtureId: Number(result.fixtureId),
          matchLabel: result.matchLabel,
          market: primaryPick.market,
          brainScore: result.finalAnalysis.brainScore,
          safetyTier: brainScoreToSafetyTier(result.finalAnalysis.brainScore),
          probability: primaryPick.probability,
          kickoffAt: result.fixture?.fixture?.date || null,
          note:
            language === "en"
              ? "Featured Brain Pick from user analysis"
              : "Utvalt Brain Pick från användaranalys",
        });
      }
    }

    return NextResponse.json({
      success: true,
      userPlan,
      brainPickLimit,
      saved: inserted,
      usedData,
      analysis: primary.finalAnalysis,
      matches,
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