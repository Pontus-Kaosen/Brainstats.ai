import type { Language } from "@/lib/translations";
import {
  parsePredictionPercent,
  summarizeEventsForPrompt,
  summarizeFixtureStatsForPrompt,
  summarizeLeagueLeadersForPrompt,
  summarizePredictionForPrompt,
  summarizeRecentMatchStats,
  type RecentMatchStatsPack,
} from "@/lib/apiFootballEnrichment";

type WeatherData = {
  city?: string;
  temperature?: number | null;
  description?: string | null;
  wind?: number | null;
  humidity?: number | null;
} | null;

type FormSummary = {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  label: string;
};

type DataQuality = {
  score: number;
  tier: "high" | "medium" | "low";
  missing: string[];
  note: string;
};

type BrainScoreInput = {
  homeStanding: any;
  awayStanding: any;
  homeForm: FormSummary;
  awayForm: FormSummary;
  homeStats: any;
  awayStats: any;
  h2h: any[];
  injuries: any[];
  weather: WeatherData;
  playerStats: any;
  lineups: any[];
  isPlayerProp: boolean;
  playerLineupStatus?: string | null;
  dataQuality: DataQuality;
  prediction?: any;
};

type BrainScoreResult = {
  brainScore: number;
  riskLevel: "Low" | "Medium" | "High";
  confidence: number;
  scoreBreakdown: {
    form: number;
    table: number;
    h2h: number;
    stats: number;
    market: number;
    confidence: number;
  };
};

const labels = {
  sv: {
    noData: "Saknas",
    home: "Hemma",
    away: "Borta",
    form: "Form",
    table: "Tabell",
    season: "Säsong",
    h2h: "Inbördes möten",
    injuries: "Skador/frånvaro",
    weather: "Väder",
    referee: "Domare",
    odds: "Marknadsodds",
    prediction: "API-Football-prediktion",
    fixtureStats: "Matchstatistik (aktuell match)",
    recentStats: "Färsk matchstatistik",
    events: "Nyckelhändelser",
    leagueLeaders: "Ligaledare",
    dataQuality: "Datakvalitet",
    noInjuries: "Inga rapporterade skador för matchen.",
    noH2H: "Inga tidigare möten i underlaget.",
    noOdds: "Inga odds tillgängliga för matchen.",
    noReferee: "Domare ej publicerad.",
    noWeather: "Väder kunde inte hämtas.",
    disclaimer:
      "18+. Detta är en AI-analys baserad på tillgänglig data — inte spelråd eller garanti. Spela ansvarsfullt.",
    lowDataWarning:
      "Begränsat dataunderlag — tolka analysen extra försiktigt.",
    capReason:
      "Sannolikheten har justerats ned på grund av begränsat dataunderlag.",
    marketCapReason:
      "Sannolikheten har justerats mot marknadsodds.",
  },
  en: {
    noData: "Missing",
    home: "Home",
    away: "Away",
    form: "Form",
    table: "Table",
    season: "Season",
    h2h: "Head-to-head",
    injuries: "Injuries/absences",
    weather: "Weather",
    referee: "Referee",
    odds: "Market odds",
    prediction: "API-Football prediction",
    fixtureStats: "Current fixture statistics",
    recentStats: "Recent match statistics",
    events: "Key events",
    leagueLeaders: "League leaders",
    dataQuality: "Data quality",
    noInjuries: "No reported injuries for this match.",
    noH2H: "No head-to-head history in the dataset.",
    noOdds: "No odds available for this match.",
    noReferee: "Referee not published.",
    noWeather: "Weather could not be fetched.",
    disclaimer:
      "18+. This is an AI analysis based on available data — not betting advice or a guarantee. Gamble responsibly.",
    lowDataWarning:
      "Limited data available — interpret this analysis with extra caution.",
    capReason:
      "Probability was reduced due to limited underlying data.",
    marketCapReason:
      "Probability was adjusted toward market odds.",
  },
} as const;

function L(language: Language) {
  return labels[language];
}

function normalizeTeamStats(stats: any) {
  if (Array.isArray(stats)) {
    return stats[0] || null;
  }

  return stats || null;
}

function getMatchResultForTeam(
  match: any,
  teamId: string | number | null
) {
  if (!teamId) {
    return null;
  }

  const homeId = match?.teams?.home?.id;
  const awayId = match?.teams?.away?.id;
  const homeGoals = match?.goals?.home;
  const awayGoals = match?.goals?.away;

  if (
    homeGoals == null ||
    awayGoals == null ||
    homeId == null ||
    awayId == null
  ) {
    return null;
  }

  const isHome = String(homeId) === String(teamId);
  const scored = isHome ? Number(homeGoals) : Number(awayGoals);
  const conceded = isHome ? Number(awayGoals) : Number(homeGoals);

  if (!Number.isFinite(scored) || !Number.isFinite(conceded)) {
    return null;
  }

  let outcome: "W" | "D" | "L" = "D";

  if (scored > conceded) {
    outcome = "W";
  } else if (scored < conceded) {
    outcome = "L";
  }

  return { scored, conceded, outcome };
}

export function summarizeRecentForm(
  matches: any[],
  teamId: string | number | null,
  teamName: string,
  language: Language
): FormSummary {
  const l = L(language);
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;

  for (const match of matches || []) {
    const result = getMatchResultForTeam(match, teamId);

    if (!result) {
      continue;
    }

    goalsFor += result.scored;
    goalsAgainst += result.conceded;

    if (result.outcome === "W") wins += 1;
    if (result.outcome === "D") draws += 1;
    if (result.outcome === "L") losses += 1;
  }

  const played = wins + draws + losses;
  const points = wins * 3 + draws;

  const label =
    language === "en"
      ? `${teamName}: ${wins}-${draws}-${losses} in last ${played}, goals ${goalsFor}-${goalsAgainst}, ${points} pts`
      : `${teamName}: ${wins}-${draws}-${losses} på senaste ${played}, mål ${goalsFor}-${goalsAgainst}, ${points} p`;

  return {
    played,
    wins,
    draws,
    losses,
    goalsFor,
    goalsAgainst,
    points,
    label,
  };
}

function summarizeStanding(
  standing: any,
  sideLabel: string,
  language: Language
) {
  if (!standing) {
    return `${sideLabel}: ${L(language).noData}`;
  }

  const rank = standing.rank ?? "?";
  const points = standing.points ?? "?";
  const played = standing.all?.played ?? "?";
  const gd = standing.goalsDiff ?? "?";
  const form = standing.form || "";
  const homeRecord = sideRecord(standing.home);
  const awayRecord = sideRecord(standing.away);

  if (language === "en") {
    return `${sideLabel}: rank ${rank}, ${points} pts from ${played}, GD ${gd}${form ? `, form ${form}` : ""}. Home ${homeRecord}, away ${awayRecord}.`;
  }

  return `${sideLabel}: plats ${rank}, ${points} p efter ${played}, MS ${gd}${form ? `, form ${form}` : ""}. Hemma ${homeRecord}, borta ${awayRecord}.`;
}

function sideRecord(side: any) {
  if (!side) return "–";

  const played = side.played ?? side.fixtures?.played ?? "?";
  const win = side.win ?? side.wins ?? "?";
  const draw = side.draw ?? side.draws ?? "?";
  const lose = side.lose ?? side.loses ?? "?";

  return `${win}-${draw}-${lose} (${played})`;
}

function summarizeSeasonStats(
  statsInput: any,
  teamName: string,
  language: Language
) {
  const stats = normalizeTeamStats(statsInput);

  if (!stats) {
    return `${teamName}: ${L(language).noData}`;
  }

  const played = stats.fixtures?.played?.total ?? 0;
  const wins = stats.fixtures?.wins?.total ?? 0;
  const draws = stats.fixtures?.draws?.total ?? 0;
  const losses = stats.fixtures?.loses?.total ?? 0;
  const gf = stats.goals?.for?.total?.total ?? stats.goals?.for?.total ?? "?";
  const ga = stats.goals?.against?.total?.total ?? stats.goals?.against?.total ?? "?";
  const gfAvg = stats.goals?.for?.average?.total ?? "?";
  const gaAvg = stats.goals?.against?.average?.total ?? "?";
  const cleanSheets = stats.clean_sheet?.total ?? "?";
  const failedToScore = stats.failed_to_score?.total ?? "?";
  const homePlayed = stats.fixtures?.played?.home ?? "?";
  const homeWins = stats.fixtures?.wins?.home ?? "?";
  const awayPlayed = stats.fixtures?.played?.away ?? "?";
  const awayWins = stats.fixtures?.wins?.away ?? "?";
  const gfHome = stats.goals?.for?.total?.home ?? "?";
  const gaHome = stats.goals?.against?.total?.home ?? "?";
  const gfAway = stats.goals?.for?.total?.away ?? "?";
  const gaAway = stats.goals?.against?.total?.away ?? "?";
  const formation = stats.lineups?.[0]?.formation ?? "?";
  const penaltyScored = stats.penalty?.scored?.total ?? "?";
  const yellow = stats.cards?.yellow?.total ?? "?";
  const red = stats.cards?.red?.total ?? "?";

  if (language === "en") {
    return `${teamName}: ${wins}-${draws}-${losses} in ${played}, goals ${gf}-${ga}, avg ${gfAvg}-${gaAvg}, clean sheets ${cleanSheets}, failed to score ${failedToScore}. Home ${homeWins}/${homePlayed} (${gfHome}-${gaHome}), away ${awayWins}/${awayPlayed} (${gfAway}-${gaAway}). Usual formation ${formation}, penalties scored ${penaltyScored}, cards ${yellow} yellow / ${red} red.`;
  }

  return `${teamName}: ${wins}-${draws}-${losses} på ${played}, mål ${gf}-${ga}, snitt ${gfAvg}-${gaAvg}, nollor ${cleanSheets}, utan mål ${failedToScore}. Hemma ${homeWins}/${homePlayed} (${gfHome}-${gaHome}), borta ${awayWins}/${awayPlayed} (${gfAway}-${gaAway}). Vanlig formation ${formation}, straffar gjorda ${penaltyScored}, kort ${yellow} gula / ${red} röda.`;
}

function summarizeH2H(
  h2h: any[],
  homeTeamId: string | number | null,
  language: Language
) {
  if (!h2h?.length) {
    return L(language).noH2H;
  }

  const rows = h2h.slice(0, 8).map((match) => {
    const home = match?.teams?.home?.name || "?";
    const away = match?.teams?.away?.name || "?";
    const score = `${match?.goals?.home ?? "?"}-${match?.goals?.away ?? "?"}`;
    const winner =
      match?.teams?.home?.winner === true
        ? home
        : match?.teams?.away?.winner === true
          ? away
          : language === "en"
            ? "Draw"
            : "Oavgjort";

    return `${home} ${score} ${away} (${winner})`;
  });

  return rows.join("\n");
}

function summarizeInjuries(injuries: any[], language: Language) {
  if (!injuries?.length) {
    return L(language).noInjuries;
  }

  const rows = injuries.slice(0, 12).map((item) => {
    const player = item?.player?.name || "?";
    const team = item?.team?.name || "?";
    const reason =
      item?.player?.reason || item?.player?.type || item?.type || "?";

    return `- ${player} (${team}): ${reason}`;
  });

  return rows.join("\n");
}

export function summarizeWeatherForPrompt(
  weather: WeatherData,
  language: Language
) {
  if (!weather) {
    return L(language).noWeather;
  }

  if (language === "en") {
    return `${weather.city || "Venue"}: ${weather.temperature ?? "?"}°C, ${weather.description || "n/a"}, wind ${weather.wind ?? "?"} m/s, humidity ${weather.humidity ?? "?"}%`;
  }

  return `${weather.city || "Arena"}: ${weather.temperature ?? "?"}°C, ${weather.description || "okänt"}, vind ${weather.wind ?? "?"} m/s, luftfuktighet ${weather.humidity ?? "?"}%`;
}

function summarizeReferee(fixture: any, language: Language) {
  const referee = fixture?.fixture?.referee;

  if (!referee) {
    return L(language).noReferee;
  }

  return referee;
}

function parseDecimalOdd(value: unknown) {
  const parsed = Number.parseFloat(String(value));

  if (!Number.isFinite(parsed) || parsed <= 1) {
    return null;
  }

  return parsed;
}

function impliedProbability(odd: number) {
  return Number(((1 / odd) * 100).toFixed(1));
}

export function summarizeOddsForPrompt(oddsResponse: any[], language: Language) {
  if (!oddsResponse?.length) {
    return L(language).noOdds;
  }

  const bookmakers = oddsResponse[0]?.bookmakers || [];
  const preferred =
    bookmakers.find((item: any) =>
      /bet365|pinnacle|william hill|unibet|betfair/i.test(item?.name || "")
    ) || bookmakers[0];

  if (!preferred?.bets?.length) {
    return L(language).noOdds;
  }

  const lines: string[] = [];

  if (language === "en") {
    lines.push(`Bookmaker reference: ${preferred.name || "Unknown"}`);
  } else {
    lines.push(`Referensodds (${preferred.name || "Okänt"}):`);
  }

  const wanted = ["Match Winner", "Goals Over/Under", "Both Teams Score"];

  for (const betName of wanted) {
    const bet = preferred.bets.find((item: any) => item?.name === betName);

    if (!bet?.values?.length) {
      continue;
    }

    const formatted = bet.values
      .slice(0, 6)
      .map((entry: any) => {
        const odd = parseDecimalOdd(entry?.odd);

        if (!odd) {
          return `${entry?.value}: ?`;
        }

        return `${entry?.value}: ${odd} (${impliedProbability(odd)}%)`;
      })
      .join(", ");

    lines.push(`${betName}: ${formatted}`);
  }

  if (lines.length === 1) {
    const firstBet = preferred.bets[0];
    const formatted = (firstBet?.values || [])
      .slice(0, 4)
      .map((entry: any) => {
        const odd = parseDecimalOdd(entry?.odd);

        if (!odd) {
          return `${entry?.value}: ?`;
        }

        return `${entry?.value}: ${odd} (${impliedProbability(odd)}%)`;
      })
      .join(", ");

    lines.push(`${firstBet?.name || "Market"}: ${formatted}`);
  }

  return lines.join("\n");
}

export function assessDataQuality(input: {
  fixture: any;
  homeStanding: any;
  awayStanding: any;
  homeForm: FormSummary;
  awayForm: FormSummary;
  homeStats: any;
  awayStats: any;
  h2h: any[];
  injuries: any[];
  lineups: any[];
  weather: WeatherData;
  oddsResponse: any[];
  prediction?: any;
  fixtureStatistics?: any[];
  language: Language;
}): DataQuality {
  const l = L(input.language);
  let score = 0;
  const missing: string[] = [];

  if (input.fixture) score += 15;
  else missing.push(input.language === "en" ? "fixture" : "match");

  if (input.homeStanding && input.awayStanding) score += 20;
  else missing.push(input.language === "en" ? "standings" : "tabell");

  if (input.homeForm.played >= 3) score += 15;
  else missing.push(input.language === "en" ? "home form" : "hemmaform");

  if (input.awayForm.played >= 3) score += 15;
  else missing.push(input.language === "en" ? "away form" : "bortaform");

  if (normalizeTeamStats(input.homeStats) && normalizeTeamStats(input.awayStats)) {
    score += 10;
  } else {
    missing.push(input.language === "en" ? "season stats" : "säsongsstatistik");
  }

  if (input.h2h.length > 0) score += 8;
  if (input.injuries.length >= 0) score += 5;
  if (input.lineups.length > 0) score += 7;
  if (input.weather) score += 5;
  if (input.oddsResponse.length > 0) score += 10;
  else missing.push("odds");

  if (input.prediction) score += 6;
  if (input.fixtureStatistics && input.fixtureStatistics.length > 0) {
    score += 4;
  }

  score = Math.min(100, score);

  const tier =
    score >= 75 ? "high" : score >= 55 ? "medium" : "low";

  let note =
    input.language === "en"
      ? `Data quality ${score}/100 (${tier}).`
      : `Datakvalitet ${score}/100 (${tier}).`;

  if (missing.length > 0) {
    note +=
      input.language === "en"
        ? ` Missing: ${missing.join(", ")}.`
        : ` Saknas: ${missing.join(", ")}.`;
  }

  if (tier === "low") {
    note += ` ${l.lowDataWarning}`;
  }

  return { score, tier, missing, note };
}

function finishedRows(matches: any[], teamId: string | number | null) {
  return (Array.isArray(matches) ? matches : [])
    .map((match) => {
      const result = getMatchResultForTeam(match, teamId);

      if (!result) return null;

      const isHome = String(match?.teams?.home?.id) === String(teamId);
      const opponent = isHome
        ? match?.teams?.away?.name
        : match?.teams?.home?.name;
      const date = String(match?.fixture?.date || "").slice(0, 10);

      return {
        isHome,
        opponent: opponent || "?",
        date,
        scored: result.scored,
        conceded: result.conceded,
        total: result.scored + result.conceded,
        bothScored: result.scored > 0 && result.conceded > 0,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);
}

function recordLabel(
  rows: Array<{ scored: number; conceded: number }>,
  language: Language
) {
  let wins = 0;
  let draws = 0;
  let losses = 0;

  for (const row of rows) {
    if (row.scored > row.conceded) wins += 1;
    else if (row.scored < row.conceded) losses += 1;
    else draws += 1;
  }

  const played = rows.length;

  if (played === 0) {
    return language === "en" ? "no matches" : "inga matcher";
  }

  return `${wins}-${draws}-${losses} (${played})`;
}

function rateLabel(count: number, total: number) {
  if (total === 0) return "–";

  return `${count}/${total}`;
}

function summarizeConcreteFacts(input: {
  fixture: any;
  homeLastMatches: any[];
  awayLastMatches: any[];
  h2h: any[];
  topScorers?: Array<{ name?: string | null; team?: string | null; value?: number | null }>;
  topAssists?: Array<{ name?: string | null; team?: string | null; value?: number | null }>;
  language: Language;
}) {
  const language = input.language;
  const homeId = input.fixture?.teams?.home?.id ?? null;
  const awayId = input.fixture?.teams?.away?.id ?? null;
  const homeName = input.fixture?.teams?.home?.name || (language === "en" ? "Home" : "Hemma");
  const awayName = input.fixture?.teams?.away?.name || (language === "en" ? "Away" : "Borta");
  const homeRows = finishedRows(input.homeLastMatches, homeId);
  const awayRows = finishedRows(input.awayLastMatches, awayId);
  const lines: string[] = [];

  const formatResults = (
    name: string,
    rows: ReturnType<typeof finishedRows>
  ) => {
    const sample = rows.slice(0, 5).map((row) => {
      const venue =
        language === "en"
          ? row.isHome
            ? "H"
            : "A"
          : row.isHome
            ? "H"
            : "B";

      return `${row.date} ${venue} ${row.opponent} ${row.scored}-${row.conceded}`;
    });

    if (sample.length === 0) {
      return language === "en"
        ? `${name}: no finished matches in the sample.`
        : `${name}: inga färdigspelade matcher i urvalet.`;
    }

    return `${name}: ${sample.join("; ")}`;
  };

  lines.push(formatResults(homeName, homeRows));
  lines.push(formatResults(awayName, awayRows));

  const homeAtHome = homeRows.filter((row) => row.isHome);
  const awayOnRoad = awayRows.filter((row) => !row.isHome);

  if (language === "en") {
    lines.push(
      `Venue split in this sample: ${homeName} at home ${recordLabel(homeAtHome, language)}, ${awayName} away ${recordLabel(awayOnRoad, language)}.`
    );
    lines.push(
      `${homeName} last ${homeRows.length}: both teams scored ${rateLabel(homeRows.filter((row) => row.bothScored).length, homeRows.length)}, over 2.5 goals ${rateLabel(homeRows.filter((row) => row.total >= 3).length, homeRows.length)}.`
    );
    lines.push(
      `${awayName} last ${awayRows.length}: both teams scored ${rateLabel(awayRows.filter((row) => row.bothScored).length, awayRows.length)}, over 2.5 goals ${rateLabel(awayRows.filter((row) => row.total >= 3).length, awayRows.length)}.`
    );
  } else {
    lines.push(
      `Hemma/borta i urvalet: ${homeName} hemma ${recordLabel(homeAtHome, language)}, ${awayName} borta ${recordLabel(awayOnRoad, language)}.`
    );
    lines.push(
      `${homeName} senaste ${homeRows.length}: båda lagen mål ${rateLabel(homeRows.filter((row) => row.bothScored).length, homeRows.length)}, över 2,5 mål ${rateLabel(homeRows.filter((row) => row.total >= 3).length, homeRows.length)}.`
    );
    lines.push(
      `${awayName} senaste ${awayRows.length}: båda lagen mål ${rateLabel(awayRows.filter((row) => row.bothScored).length, awayRows.length)}, över 2,5 mål ${rateLabel(awayRows.filter((row) => row.total >= 3).length, awayRows.length)}.`
    );
  }

  const kickoff = input.fixture?.fixture?.date
    ? new Date(input.fixture.fixture.date).getTime()
    : NaN;

  const restLine = (
    name: string,
    rows: ReturnType<typeof finishedRows>
  ) => {
    const latest = rows
      .map((row) => new Date(row.date).getTime())
      .filter((value) => Number.isFinite(value))
      .sort((a, b) => b - a)[0];

    if (!Number.isFinite(kickoff) || latest == null) {
      return null;
    }

    const days = Math.round((kickoff - latest) / 86_400_000);

    if (days < 0 || days > 40) return null;

    return language === "en"
      ? `${name} last played ${days} day${days === 1 ? "" : "s"} before this match.`
      : `${name} spelade senast för ${days} dag${days === 1 ? "" : "ar"} sedan.`;
  };

  const homeRest = restLine(homeName, homeRows);
  const awayRest = restLine(awayName, awayRows);

  if (homeRest) lines.push(homeRest);
  if (awayRest) lines.push(awayRest);

  const h2hRows = finishedRows(input.h2h, homeId);

  if (h2hRows.length > 0) {
    const goals = h2hRows.reduce((sum, row) => sum + row.total, 0);
    const average = (goals / h2hRows.length).toFixed(1);

    lines.push(
      language === "en"
        ? `Head-to-head from ${homeName}'s side: ${recordLabel(h2hRows, language)}, average ${average} goals.`
        : `Inbördes från ${homeName}s håll: ${recordLabel(h2hRows, language)}, snitt ${average} mål.`
    );
  }

  const clubNames = [homeName, awayName].map((name) => name.toLowerCase());
  const involved = [...(input.topScorers || []), ...(input.topAssists || [])].filter(
    (row) => clubNames.includes(String(row.team || "").toLowerCase())
  );

  if (involved.length > 0) {
    const names = involved
      .map((row) => `${row.name || "?"} (${row.team || "?"}, ${row.value ?? "?"})`)
      .join("; ");

    lines.push(
      language === "en"
        ? `League leaders from these clubs: ${names}.`
        : `Ligaledare från de här lagen: ${names}.`
    );
  }

  return lines.join("\n");
}

function summarizeCoach(
  coach: { name?: string | null; nationality?: string | null; since?: string | null } | null | undefined,
  teamName: string,
  language: Language
) {
  if (!coach?.name) {
    return language === "en"
      ? `${teamName}: coach not available.`
      : `${teamName}: tränare saknas.`;
  }

  const since = coach.since
    ? language === "en"
      ? `, since ${coach.since}`
      : `, sedan ${coach.since}`
    : "";
  const nationality = coach.nationality ? `, ${coach.nationality}` : "";

  return `${teamName}: ${coach.name}${nationality}${since}`;
}

function summarizeMatchPlayers(
  squads: any[] | undefined,
  teamId: string | number | null,
  teamName: string,
  language: Language
) {
  const block = (Array.isArray(squads) ? squads : []).find(
    (item) => teamId != null && String(item?.team?.id) === String(teamId)
  );
  const players = Array.isArray(block?.players) ? block.players : [];

  const lines = players
    .map((item: any) => {
      const stats = item?.statistics?.[0];
      const minutes = Number(stats?.games?.minutes ?? 0);

      if (!minutes) return null;

      const goals = Number(stats?.goals?.total ?? 0);
      const assists = Number(stats?.goals?.assists ?? 0);
      const rating = stats?.games?.rating;
      const bits = [`${minutes} min`];

      if (rating) bits.push(language === "en" ? `rating ${rating}` : `betyg ${rating}`);
      if (goals) bits.push(language === "en" ? `${goals} goals` : `${goals} mål`);
      if (assists) bits.push(`${assists} assist`);

      return {
        minutes,
        goals,
        assists,
        text: `${item?.player?.name || "?"}: ${bits.join(", ")}`,
      };
    })
    .filter((row: any) => row)
    .sort((a: any, b: any) => b.goals + b.assists - (a.goals + a.assists) || b.minutes - a.minutes)
    .slice(0, 6)
    .map((row: any) => row.text);

  if (lines.length === 0) {
    return language === "en"
      ? `${teamName}: no player ratings from the previous match.`
      : `${teamName}: inga spelbetyg från föregående match.`;
  }

  return `${teamName}: ${lines.join("; ")}`;
}

export function buildStructuredAnalysisContext(input: {
  fixture: any;
  homeStanding: any;
  awayStanding: any;
  homeForm: FormSummary;
  awayForm: FormSummary;
  homeStats: any;
  awayStats: any;
  h2h: any[];
  homeLastMatches: any[];
  awayLastMatches: any[];
  injuries: any[];
  weather: WeatherData;
  oddsResponse: any[];
  prediction?: any;
  fixtureStatistics?: any[];
  fixtureEvents?: any[];
  recentMatchStats?: RecentMatchStatsPack[];
  topScorers?: any[];
  topAssists?: any[];
  homeCoach?: { name?: string | null; nationality?: string | null; since?: string | null } | null;
  awayCoach?: { name?: string | null; nationality?: string | null; since?: string | null } | null;
  homeMatchPlayers?: any[];
  awayMatchPlayers?: any[];
  dataQuality: DataQuality;
  language: Language;
}) {
  const l = L(input.language);

  return `
${l.table}:
${summarizeStanding(input.homeStanding, l.home, input.language)}
${summarizeStanding(input.awayStanding, l.away, input.language)}

${l.form}:
${input.homeForm.label}
${input.awayForm.label}

${input.language === "en" ? "Concrete match facts" : "Konkreta matchfakta"}:
${summarizeConcreteFacts(input)}

${l.season}:
${summarizeSeasonStats(input.homeStats, input.fixture?.teams?.home?.name || l.home, input.language)}
${summarizeSeasonStats(input.awayStats, input.fixture?.teams?.away?.name || l.away, input.language)}

${input.language === "en" ? "Coaches" : "Tränare"}:
${summarizeCoach(input.homeCoach, input.fixture?.teams?.home?.name || l.home, input.language)}
${summarizeCoach(input.awayCoach, input.fixture?.teams?.away?.name || l.away, input.language)}

${input.language === "en" ? "Last match player ratings" : "Spelbetyg från senaste matchen"}:
${summarizeMatchPlayers(input.homeMatchPlayers, input.fixture?.teams?.home?.id, input.fixture?.teams?.home?.name || l.home, input.language)}
${summarizeMatchPlayers(input.awayMatchPlayers, input.fixture?.teams?.away?.id, input.fixture?.teams?.away?.name || l.away, input.language)}

${l.h2h}:
${summarizeH2H(input.h2h, input.fixture?.teams?.home?.id, input.language)}

${l.injuries}:
${summarizeInjuries(input.injuries, input.language)}

${l.weather}:
${summarizeWeatherForPrompt(input.weather, input.language)}

${l.referee}:
${summarizeReferee(input.fixture, input.language)}

${l.odds}:
${summarizeOddsForPrompt(input.oddsResponse, input.language)}

${l.prediction}:
${summarizePredictionForPrompt(input.prediction, input.language)}

${l.fixtureStats}:
${summarizeFixtureStatsForPrompt(input.fixtureStatistics || [], input.language)}

${l.recentStats}:
${summarizeRecentMatchStats(
  input.recentMatchStats || [],
  input.fixture?.teams?.home?.id ?? null,
  input.fixture?.teams?.away?.id ?? null,
  input.language
)}

${l.events}:
${summarizeEventsForPrompt(input.fixtureEvents || [], input.language)}

${l.leagueLeaders}:
${summarizeLeagueLeadersForPrompt(
  input.topScorers || [],
  input.topAssists || [],
  input.language
)}

${l.dataQuality}:
${input.dataQuality.note}
`.trim();
}

export function calculateEnhancedBrainScore(
  input: BrainScoreInput
): BrainScoreResult {
  let score = 50;

  const breakdown = {
    form: 10,
    table: 10,
    h2h: 10,
    stats: 10,
    market: 10,
    confidence: 10,
  };

  if (input.homeStanding && input.awayStanding) {
    const rankDiff =
      Number(input.awayStanding.rank || 0) -
      Number(input.homeStanding.rank || 0);

    if (rankDiff > 5) {
      score += 8;
      breakdown.table = 18;
    } else if (rankDiff > 2) {
      score += 4;
      breakdown.table = 14;
    } else if (rankDiff < -5) {
      score -= 4;
      breakdown.table = 6;
    }
  }

  const formDiff =
    input.homeForm.points - input.awayForm.points;

  if (formDiff >= 6) {
    score += 8;
    breakdown.form = 18;
  } else if (formDiff >= 3) {
    score += 4;
    breakdown.form = 14;
  } else if (formDiff <= -6) {
    score -= 6;
    breakdown.form = 6;
  } else if (formDiff <= -3) {
    score -= 3;
    breakdown.form = 8;
  }

  const homeSeason = normalizeTeamStats(input.homeStats);
  const awaySeason = normalizeTeamStats(input.awayStats);

  if (homeSeason && awaySeason) {
    const homeAvgFor = Number(homeSeason.goals?.for?.average?.total || 0);
    const awayAvgAgainst = Number(
      awaySeason.goals?.against?.average?.total || 0
    );

    if (homeAvgFor >= 1.6 && awayAvgAgainst >= 1.3) {
      score += 4;
      breakdown.stats = 16;
    } else {
      breakdown.stats = 12;
    }
  }

  if (input.h2h.length > 0) {
    score += 5;
    breakdown.h2h = 15;
  }

  const homeWinPct = parsePredictionPercent(input.prediction?.percent?.home);

  if (homeWinPct != null) {
    if (homeWinPct >= 55) {
      score += 3;
      breakdown.market = Math.max(breakdown.market, 14);
    } else if (homeWinPct <= 30) {
      score -= 2;
    }
  }

  if (input.playerStats && input.isPlayerProp) {
    score += 12;
    breakdown.market = 18;
  }

  if (input.lineups.length > 0) {
    score += 3;
    breakdown.confidence = 14;
  }

  if (input.isPlayerProp && input.playerLineupStatus === "starting") {
    score += 5;
    breakdown.confidence = Math.max(breakdown.confidence, 16);
  }

  if (input.isPlayerProp && input.playerLineupStatus === "bench") {
    score -= 10;
    breakdown.market = Math.max(0, breakdown.market - 8);
  }

  if (input.isPlayerProp && input.playerLineupStatus === "not_in_squad") {
    score -= 18;
    breakdown.market = Math.max(0, breakdown.market - 12);
  }

  if (input.injuries.length > 0) {
    score -= Math.min(input.injuries.length * 2, 10);
  }

  if (input.weather) {
    const wind = Number(input.weather.wind || 0);

    if (wind >= 10) {
      score -= 3;
      breakdown.confidence = Math.max(6, breakdown.confidence - 4);
    } else {
      score += 2;
      breakdown.confidence = Math.max(breakdown.confidence, 12);
    }
  }

  if (input.dataQuality.tier === "high") {
    score += 4;
    breakdown.confidence = Math.max(breakdown.confidence, 15);
  } else if (input.dataQuality.tier === "low") {
    score -= 8;
    breakdown.confidence = Math.max(6, breakdown.confidence - 6);
    breakdown.market = Math.max(6, breakdown.market - 4);
  } else {
    score -= 2;
  }

  const brainScore = Math.max(0, Math.min(100, score));
  const riskLevel =
    brainScore >= 80 ? "Low" : brainScore < 60 ? "High" : "Medium";

  const confidence = Math.min(
    95,
    Math.max(
      35,
      brainScore +
        (input.dataQuality.tier === "high"
          ? 5
          : input.dataQuality.tier === "low"
            ? -8
            : 0)
    )
  );

  return {
    brainScore,
    riskLevel,
    confidence,
    scoreBreakdown: breakdown,
  };
}

export function getAnalysisDisclaimer(language: Language) {
  return L(language).disclaimer;
}

export function applyAnalysisSafetyGuardrails(
  analysis: {
    summary: string;
    strengths: string[];
    risks: string[];
    recommendation: string;
    brainPicks: Array<{
      id: number;
      market: string;
      probability: number;
      estimatedOdds: number;
      riskLevel: "Low" | "Medium" | "High";
      reason: string;
    }>;
    brainPick: {
      market: string;
      confidence: number;
      reason: string;
    };
  },
  options: {
    language: Language;
    dataQuality: DataQuality;
    oddsResponse: any[];
  }
) {
  const l = L(options.language);
  const disclaimer = getAnalysisDisclaimer(options.language);
  const risks = [...analysis.risks];

  if (options.dataQuality.tier !== "high") {
    risks.push(options.dataQuality.note);
  }

  const maxProbability =
    options.dataQuality.tier === "high"
      ? 82
      : options.dataQuality.tier === "medium"
        ? 72
        : 62;

  const adjustedPicks = analysis.brainPicks.map((pick) => {
    let probability = pick.probability;
    let reason = pick.reason;

    if (probability > maxProbability) {
      probability = maxProbability;
      reason = `${reason} ${l.capReason}`;
    }

    return {
      ...pick,
      probability,
      estimatedOdds: Number((100 / Math.max(1, probability)).toFixed(2)),
      reason,
    };
  });

  let recommendation = analysis.recommendation.trim();

  if (!recommendation.includes("18+")) {
    recommendation = `${recommendation}\n\n${disclaimer}`;
  }

  const firstPick = adjustedPicks[0] || analysis.brainPick;

  return {
    ...analysis,
    risks: Array.from(new Set(risks.filter(Boolean))).slice(0, 5),
    recommendation,
    brainPicks: adjustedPicks,
    brainPick: {
      market: firstPick.market,
      confidence: firstPick.probability,
      reason: firstPick.reason,
    },
  };
}

export { normalizeTeamStats };
