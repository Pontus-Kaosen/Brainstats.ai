import type { Language } from "@/lib/translations";

export function parseRequestLanguage(value: unknown): Language {
  return value === "en" ? "en" : "sv";
}

const labels = {
  sv: {
    unknown: "Okänd",
    unknownPlayer: "Okänd spelare",
    unknownTeam: "Okänt lag",
    unknownLeague: "Okänd liga",
    unknownDate: "Okänt datum",
    unknownMatch: "Okänd match",
    notAvailable: "Ej tillgänglig",
    notSpecified: "Ej angiven",
    missing: "Saknas",
    homeTeam: "Hemmalag",
    awayTeam: "Bortalag",
    noPlayerStats: "Ingen spelarstatistik tillgänglig.",
    lineupsNotPublished:
      "Bekräftade startelvor är ännu inte publicerade.",
    player: "Spelare",
    position: "Position",
    matches: "Matcher",
    starts: "Starter",
    minutes: "Minuter",
    goals: "Mål",
    assists: "Assist",
    shots: "Skott",
    shotsOnTarget: "Skott på mål",
    passAccuracy: "Passningsprocent",
    rating: "Betyg",
    team: "Lag",
    formation: "Formation",
    coach: "Tränare",
    startingXi: "Startelva",
  },
  en: {
    unknown: "Unknown",
    unknownPlayer: "Unknown player",
    unknownTeam: "Unknown team",
    unknownLeague: "Unknown league",
    unknownDate: "Unknown date",
    unknownMatch: "Unknown match",
    notAvailable: "Not available",
    notSpecified: "Not specified",
    missing: "N/A",
    homeTeam: "Home team",
    awayTeam: "Away team",
    noPlayerStats: "No player statistics available.",
    lineupsNotPublished: "Confirmed lineups are not published yet.",
    player: "Player",
    position: "Position",
    matches: "Matches",
    starts: "Starts",
    minutes: "Minutes",
    goals: "Goals",
    assists: "Assists",
    shots: "Shots",
    shotsOnTarget: "Shots on target",
    passAccuracy: "Pass accuracy",
    rating: "Rating",
    team: "Team",
    formation: "Formation",
    coach: "Coach",
    startingXi: "Starting XI",
  },
} as const;

function L(language: Language) {
  return labels[language];
}

export function summarizePlayerStatsForPrompt(
  player: any,
  language: Language
) {
  const l = L(language);

  if (!player) {
    return l.noPlayerStats;
  }

  const stats = player.statistics?.[0];

  if (!stats) {
    return l.noPlayerStats;
  }

  return `
${l.player}: ${player.player?.name || l.unknown}
${l.position}: ${player.player?.position || l.unknown}
${l.matches}: ${stats.games?.appearences ?? l.missing}
${l.starts}: ${stats.games?.lineups ?? l.missing}
${l.minutes}: ${stats.games?.minutes ?? l.missing}
${l.goals}: ${stats.goals?.total ?? l.missing}
${l.assists}: ${stats.goals?.assists ?? l.missing}
${l.shots}: ${stats.shots?.total ?? l.missing}
${l.shotsOnTarget}: ${stats.shots?.on ?? l.missing}
${l.passAccuracy}: ${stats.passes?.accuracy ?? l.missing}
${l.rating}: ${stats.games?.rating ?? l.missing}
`;
}

export function summarizeLineupsForPrompt(
  lineups: any[],
  language: Language
) {
  const l = L(language);

  if (!Array.isArray(lineups) || lineups.length < 2) {
    return l.lineupsNotPublished;
  }

  return lineups
    .map((lineup) => {
      const players = (lineup.startXI || [])
        .map(
          (player: any) =>
            `${player.number ?? "-"} ${
              player.name || l.unknownPlayer
            } (${player.position || "-"})`
        )
        .join(", ");

      return `
${l.team}: ${lineup.team?.name || l.unknownTeam}
${l.formation}: ${lineup.formation || l.notSpecified}
${l.coach}: ${lineup.coach?.name || l.notSpecified}
${l.startingXi}: ${players || l.notAvailable}
`;
    })
    .join("\n");
}

type AnalyzePromptInput = {
  text: string;
  fixture: any;
  userPlan: string;
  brainPickLimit: number;
  lineups: any[];
  homeStanding: any;
  awayStanding: any;
  homeStats: any;
  awayStats: any;
  h2h: any[];
  homeLastMatches: any[];
  awayLastMatches: any[];
  injuries: any[];
  playerStats: any;
  playerId: string | null;
};

export function buildAnalyzeSystemPrompt(language: Language) {
  if (language === "en") {
    return (
      "You are Brain Engine, the AI engine behind BrainStats. Analyze football objectively and data-driven. " +
      "Never promise outcomes, never call a bet safe, and never encourage irresponsible gambling. " +
      "Use only data provided in the context and clearly state when data is missing. " +
      "Respond only with valid JSON. Write all user-facing text fields in English."
    );
  }

  return (
    "Du är Brain Engine, AI-motorn bakom BrainStats. Analysera fotboll objektivt och datadrivet. " +
    "Lova aldrig resultat, kalla aldrig ett spel säkert och uppmuntra aldrig oansvarigt spelande. " +
    "Använd endast data som finns i underlaget och säg tydligt när data saknas. " +
    "Svara endast med giltig JSON. Skriv all användartext på svenska."
  );
}

export function buildAnalyzeUserPrompt(
  language: Language,
  input: AnalyzePromptInput
) {
  const l = L(language);
  const fixture = input.fixture;

  if (language === "en") {
    return `
Analyze the following football bet idea:

${input.text}

Match:
${fixture?.teams?.home?.name || l.homeTeam} - ${
      fixture?.teams?.away?.name || l.awayTeam
    }

League:
${fixture?.league?.name || l.unknownLeague}

Date:
${fixture?.fixture?.date || l.unknownDate}

Venue:
${fixture?.fixture?.venue?.name || l.notAvailable}

User plan:
${input.userPlan}

Create exactly ${input.brainPickLimit} different Brain Picks.

Free gets 1 pick.
Pro gets 3 picks.
Elite gets 5 picks.

Each Brain Pick must include:
- market
- probability as an integer between 1 and 99
- riskLevel: Low, Medium or High
- reason with at least two concrete data points

If the selected market is a player market, picks should focus on the same player and the same type of player market.

Confirmed lineups:
${summarizeLineupsForPrompt(input.lineups, language)}

Lineup rules:
- If lineups exist, use them in the analysis.
- Mention if key players start or are missing.
- If a selected player is not in the starting XI, that must clearly affect risk and probability.
- If lineups are missing, do not guess who starts.

Home table position:
${JSON.stringify(input.homeStanding || null, null, 2)}

Away table position:
${JSON.stringify(input.awayStanding || null, null, 2)}

Home team statistics:
${JSON.stringify(input.homeStats, null, 2)}

Away team statistics:
${JSON.stringify(input.awayStats, null, 2)}

Head-to-head:
${JSON.stringify(input.h2h, null, 2)}

Home team last five:
${JSON.stringify(input.homeLastMatches, null, 2)}

Away team last five:
${JSON.stringify(input.awayLastMatches, null, 2)}

Injuries and absences:
${JSON.stringify(input.injuries, null, 2)}

Player statistics:
${summarizePlayerStatsForPrompt(input.playerStats, language)}

Respond in exactly this JSON structure:

{
  "summary": "Professional summary in English",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "risks": ["risk 1", "risk 2", "risk 3"],
  "recommendation": "Neutral recommendation in English",
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
      "market": "Pick market in English",
      "probability": 64,
      "riskLevel": "Medium",
      "reason": "Reasoning with at least two concrete data points in English"
    }
  ]
}
`;
  }

  return `
Analysera följande fotbollsidé:

${input.text}

Match:
${fixture?.teams?.home?.name || l.homeTeam} - ${
    fixture?.teams?.away?.name || l.awayTeam
  }

Liga:
${fixture?.league?.name || l.unknownLeague}

Datum:
${fixture?.fixture?.date || l.unknownDate}

Arena:
${fixture?.fixture?.venue?.name || l.notAvailable}

Användarplan:
${input.userPlan}

Skapa exakt ${input.brainPickLimit} olika Brain Picks.

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
${summarizeLineupsForPrompt(input.lineups, language)}

Viktigt om startelvor:
- Om startelvor finns ska de användas i analysen.
- Nämn om viktiga spelare startar eller saknas.
- Om en vald spelare inte startar ska det tydligt påverka risk och sannolikhet.
- Om startelvor saknas får du inte gissa vilka som startar.

Tabell hemmalag:
${JSON.stringify(input.homeStanding || null, null, 2)}

Tabell bortalag:
${JSON.stringify(input.awayStanding || null, null, 2)}

Hemmalag statistik:
${JSON.stringify(input.homeStats, null, 2)}

Bortalag statistik:
${JSON.stringify(input.awayStats, null, 2)}

Head-to-head:
${JSON.stringify(input.h2h, null, 2)}

Hemmalag senaste fem:
${JSON.stringify(input.homeLastMatches, null, 2)}

Bortalag senaste fem:
${JSON.stringify(input.awayLastMatches, null, 2)}

Skador och frånvaro:
${JSON.stringify(input.injuries, null, 2)}

Spelarstatistik:
${summarizePlayerStatsForPrompt(input.playerStats, language)}

Svara i exakt denna JSON-struktur:

{
  "summary": "Professionell sammanfattning på svenska",
  "strengths": ["styrka 1", "styrka 2", "styrka 3"],
  "risks": ["risk 1", "risk 2", "risk 3"],
  "recommendation": "Neutral rekommendation på svenska",
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
      "market": "Förslagets marknad på svenska",
      "probability": 64,
      "riskLevel": "Medium",
      "reason": "Motivering med minst två konkreta datapunkter på svenska"
    }
  ]
}
`;
}

export function getAnalyzeApiMessages(language: Language) {
  if (language === "en") {
    return {
      mustLogin: "You must be signed in to create an analysis.",
      authFailed: "Sign-in could not be verified.",
      noBetIdea: "No bet idea was submitted.",
      freeLimit:
        "The Free plan allows 3 analyses per day. Upgrade to Pro for unlimited analyses.",
      unknownMatch: "Unknown match",
      parseFallbackSummary: "The AI completed the analysis.",
      parseFallbackStrength: "The AI completed the analysis.",
      parseFallbackRisk: "The AI response could not be fully structured.",
      parseFallbackRecommendation: "Review the analysis critically.",
    };
  }

  return {
    mustLogin: "Du måste vara inloggad för att skapa en analys.",
    authFailed: "Inloggningen kunde inte verifieras.",
    noBetIdea: "Ingen spelidé skickades.",
    freeLimit:
      "Free-planen tillåter 3 analyser per dag. Uppgradera till Pro för obegränsade analyser.",
    unknownMatch: "Okänd match",
    parseFallbackSummary: "AI kunde genomföra analysen.",
    parseFallbackStrength: "AI kunde genomföra analysen.",
    parseFallbackRisk: "AI-svaret kunde inte struktureras helt.",
    parseFallbackRecommendation: "Kontrollera analysen kritiskt.",
  };
}

export function buildDailySlipsSystemPrompt(language: Language) {
  if (language === "en") {
    return (
      "You create neutral, data-driven football bet slips. " +
      "Never call a bet safe, guaranteed or risk-free. " +
      "Use only matches from the provided list. " +
      "Respond only with valid JSON. Write all user-facing text in English."
    );
  }

  return (
    "Du skapar neutrala, datadrivna fotbollskuponger. " +
    "Du får aldrig kalla ett spel säkert, garanterat eller riskfritt. " +
    "Använd endast matcher som finns i listan. " +
    "Svara endast med giltig JSON. Skriv all användartext på svenska."
  );
}

export function buildDailySlipsUserPrompt(
  language: Language,
  slipLimit: number,
  plan: string,
  fixtures: unknown
) {
  if (language === "en") {
    return `
Create exactly ${slipLimit} separate AI bet slips.

User plan:
${plan}

Slip profiles in this order:

1. Lower risk
2. Balanced
3. Value
4. Higher risk
5. Special

Rules:

- Each slip must contain exactly 3 picks.
- Each pick must come from a match in the list.
- Do not use the same match more than once in the same slip.
- Do not use the exact same combination in multiple slips.
- Probability must be an integer between 10 and 95.
- No pick may be described as safe or guaranteed.

Each pick must include:

- match
- market
- probability

Use only these markets:

- Home win
- Away win
- Double chance
- Draw No Bet
- Over 1.5 goals
- Over 2.5 goals
- Under 3.5 goals
- Both teams to score

Use only these upcoming matches:

${JSON.stringify(fixtures, null, 2)}

Respond exactly in this JSON structure:

{
  "slips": [
    {
      "title": "Lower risk",
      "risk": "Lower risk",
      "confidence": 78,
      "picks": [
        {
          "match": "Team A - Team B",
          "market": "Double chance Team A or draw",
          "probability": 72
        }
      ]
    }
  ]
}
`;
  }

  return `
Skapa exakt ${slipLimit} separata AI-kuponger.

Användarens plan är:
${plan}

Kupongprofiler i denna ordning:

1. Lägre risk
2. Balanserad
3. Value
4. Högre risk
5. Special

Regler:

- Varje kupong ska innehålla exakt 3 val.
- Varje val ska komma från en match i listan.
- Använd inte samma match mer än en gång i samma kupong.
- Använd inte exakt samma kombination i flera kuponger.
- Probability ska vara ett heltal mellan 10 och 95.
- Inget spel får beskrivas som säkert eller garanterat.

Varje val måste innehålla:

- match
- market
- probability

Använd bara dessa marknader:

- Hemmalag vinner
- Bortalag vinner
- Dubbelchans
- Draw No Bet
- Över 1.5 mål
- Över 2.5 mål
- Under 3.5 mål
- Båda lagen gör mål

Använd endast dessa kommande matcher:

${JSON.stringify(fixtures, null, 2)}

Svara exakt enligt denna JSON-struktur:

{
  "slips": [
    {
      "title": "Lägre risk",
      "risk": "Lägre risk",
      "confidence": 78,
      "picks": [
        {
          "match": "Lag A - Lag B",
          "market": "Dubbelchans Lag A eller oavgjort",
          "probability": 72
        }
      ]
    }
  ]
}
`;
}

export function getDailySlipsApiMessages(language: Language) {
  if (language === "en") {
    return {
      mustLogin: "You must be signed in.",
      authFailed: "Sign-in could not be verified.",
      notEnoughFixtures:
        "There are not enough upcoming matches to create today's slips.",
      createFailed: "Today's slips could not be created.",
      regenerateFailed: (generated: number, limit: number) =>
        `AI created only ${generated} of ${limit} slips. Try again.`,
    };
  }

  return {
    mustLogin: "Du måste vara inloggad.",
    authFailed: "Inloggningen kunde inte verifieras.",
    notEnoughFixtures:
      "Det finns inte tillräckligt många kommande matcher för att skapa dagens kuponger.",
    createFailed: "Dagens kuponger kunde inte skapas.",
    regenerateFailed: (generated: number, limit: number) =>
      `AI skapade endast ${generated} av ${limit} kuponger. Försök igen.`,
  };
}

export type SlipPickMeta = {
  match?: string;
  market?: string;
  probability?: number;
  estimatedOdds?: number;
  reason?: string;
  isMeta?: boolean;
  metaLanguage?: Language;
};

export function attachSlipLanguage(
  picks: SlipPickMeta[],
  language: Language
) {
  return [
    ...picks,
    {
      match: "",
      market: "",
      probability: 0,
      estimatedOdds: 0,
      isMeta: true,
      metaLanguage: language,
    },
  ];
}

export function getSlipLanguage(
  picks: SlipPickMeta[]
): Language | null {
  const meta = picks.find(
    (pick) => pick.isMeta && pick.metaLanguage
  );

  if (meta?.metaLanguage === "en" || meta?.metaLanguage === "sv") {
    return meta.metaLanguage;
  }

  return null;
}

export function stripMetaPicks(picks: SlipPickMeta[]) {
  return picks.filter((pick) => !pick.isMeta);
}
