import type { Language } from "@/lib/translations";
import {
  describePlayerLineupStatus,
  hasPartialLineups,
  type PlayerLineupStatus,
} from "@/lib/lineups";
import { summarizeRotationRisksForPrompt, type RotationRisk } from "@/lib/matchImportance";

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
    substitutes: "Avbytare",
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
    substitutes: "Substitutes",
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

  if (!Array.isArray(lineups) || !hasPartialLineups(lineups)) {
    return l.lineupsNotPublished;
  }

  return lineups
    .filter((lineup) => (lineup.startXI?.length ?? 0) > 0)
    .map((lineup) => {
      const players = (lineup.startXI || [])
        .map(
          (player: any) =>
            `${player.number ?? "-"} ${
              player.name || l.unknownPlayer
            } (${player.position || "-"})`
        )
        .join(", ");

      const bench = (lineup.substitutes || [])
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
${l.substitutes}: ${bench || l.notAvailable}
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
  rotationRisks: RotationRisk[];
  playerLineupStatus?: PlayerLineupStatus | null;
  structuredContext: string;
  dataQualityNote: string;
  calibrationNote?: string;
};

export function buildAnalyzeSystemPrompt(language: Language) {
  if (language === "en") {
    return (
      "You are Brain Engine, the AI engine behind BrainStats. Analyze football objectively and data-driven. " +
      "Never promise outcomes, never call a bet safe, and never encourage irresponsible gambling. " +
      "Use only data provided in the context and clearly state when data is missing. " +
      "When market odds are provided, treat them as a reference anchor and avoid probabilities far above the market unless multiple strong signals support it. " +
      "If data quality is low, use cautious language and lower probabilities. " +
      "Respond only with valid JSON. Write all user-facing text fields in English."
    );
  }

  return (
    "Du är Brain Engine, AI-motorn bakom BrainStats. Analysera fotboll objektivt och datadrivet. " +
    "Lova aldrig resultat, kalla aldrig ett spel säkert och uppmuntra aldrig oansvarigt spelande. " +
    "Använd endast data som finns i underlaget och säg tydligt när data saknas. " +
    "När marknadsodds finns ska de användas som referens — undvik sannolikheter långt över marknaden om inte flera starka signaler stödjer det. " +
    "Vid låg datakvalitet ska språket vara försiktigt och sannolikheterna lägre. " +
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

Structured match data:
${input.structuredContext}

Data quality note:
${input.dataQualityNote}

Historical calibration:
${input.calibrationNote || (language === "en" ? "Not enough resolved public picks yet." : "Inte tillräckligt med avgjorda publika tips ännu.")}

Analysis rules:
- Use the structured match data above as the primary source.
- Mention missing data explicitly in risks when relevant.
- Keep probabilities realistic and anchored to market odds when available.
- Do not exceed 75% probability unless data quality is high and several signals align.

Player statistics:
${summarizePlayerStatsForPrompt(input.playerStats, language)}

Selected player lineup status:
${
  input.playerId
    ? describePlayerLineupStatus(
        input.playerLineupStatus || "unknown",
        language
      )
    : language === "en"
      ? "Not a player market."
      : "Inte en spelarmarknad."
}

Schedule / rotation context (next 7 days for bet-relevant team(s)):
${summarizeRotationRisksForPrompt(input.rotationRisks || [], "en")}

Schedule rules:
- If a bet team has a more important match shortly before or after this fixture, mention possible rotation, rest or reduced intensity.
- This is especially important for team-win, team performance and player markets on that team.
- Adjust risks and probability accordingly, but do not name specific rested players unless lineups confirm it.

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

Strukturerat matchunderlag:
${input.structuredContext}

Datakvalitet:
${input.dataQualityNote}

Historisk kalibrering:
${input.calibrationNote || "Inte tillräckligt med avgjorda publika tips ännu."}

Analysregler:
- Använd strukturerat matchunderlag som primär källa.
- Nämn saknad data tydligt i risker när det är relevant.
- Håll sannolikheter realistiska och förankra dem i marknadsodds när de finns.
- Överskrid inte 75% sannolikhet om inte datakvaliteten är hög och flera signaler pekar samma håll.

Spelarstatistik:
${summarizePlayerStatsForPrompt(input.playerStats, language)}

Status för vald spelare i startelva/trupp:
${
  input.playerId
    ? describePlayerLineupStatus(
        input.playerLineupStatus || "unknown",
        language
      )
    : "Inte en spelarmarknad."
}

Matchschema / rotationskontext (7 dagar för lag som spelidén gäller):
${summarizeRotationRisksForPrompt(input.rotationRisks || [], "sv")}

Regler för matchschema:
- Om ett lag har en viktigare match strax före eller efter denna fixture ska möjlig rotation, vila eller lägre intensitet nämnas.
- Detta är särskilt viktigt vid lagvinst, lagprestation och spelarmarknader för det laget.
- Justera risker och sannolikhet därefter, men gissa inte vilka spelare som vilar om startelvor inte bekräftar det.

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

export function buildBetImageSystemPrompt(language: Language) {
  if (language === "en") {
    return (
      "You read screenshots of football bet slips from bookmakers and betting apps. " +
      "Extract teams, markets and player names exactly as shown. " +
      "Normalize market text into clear football betting terms. " +
      "Respond only with valid JSON."
    );
  }

  return (
    "Du läser skärmbilder av fotbollskuponger från spelbolag och bettingappar. " +
    "Extrahera lag, marknader och spelarnamn exakt som de visas. " +
    "Normalisera marknadstext till tydliga fotbollsspeltermer. " +
    "Svara endast med giltig JSON."
  );
}

export function buildBetImageUserPrompt(language: Language) {
  if (language === "en") {
    return `Read this bet slip image and extract every visible football selection.

Return JSON in this shape:
{
  "picks": [
    {
      "homeTeam": "Home team name",
      "awayTeam": "Away team name",
      "market": "Market in clear English, e.g. Over 2.5 goals",
      "playerName": "Player name or null"
    }
  ]
}

Rules:
- Use the full team names when visible.
- If only one team is tied to a player market, infer the opponent from the match header.
- Convert shorthand like "O2.5", "BTTS", "DNB" into readable market names.
- Include all legs visible on the coupon.
- Use null for playerName when not a player market.`;
  }

  return `Läs den här kupongbilden och extrahera varje synligt fotbollsval.

Returnera JSON i denna form:
{
  "picks": [
    {
      "homeTeam": "Hemmalag",
      "awayTeam": "Bortalag",
      "market": "Marknad på tydlig svenska, t.ex. Över 2.5 mål",
      "playerName": "Spelarnamn eller null"
    }
  ]
}

Regler:
- Använd fulla lagnamn när de syns.
- Om bara ett lag syns vid en spelarmarknad, hämta motståndaren från matchrubriken.
- Översätt förkortningar som "Ö2.5", "BTTS", "DNB" till läsbara marknadsnamn.
- Ta med alla val som syns på kupongen.
- Använd null för playerName när det inte är en spelarmarknad.`;
}

export function getParseImageApiMessages(language: Language) {
  if (language === "en") {
    return {
      mustLogin: "You must be signed in to read a bet slip image.",
      authFailed: "Sign-in could not be verified.",
      noImage: "No image was uploaded.",
      invalidImage: "The file must be a JPG, PNG or WebP image under 5 MB.",
      parseFailed: "The bet slip image could not be read. Try a clearer photo.",
      noPicksFound: "No bet selections were found in the image.",
    };
  }

  return {
    mustLogin: "Du måste vara inloggad för att läsa en kupongbild.",
    authFailed: "Inloggningen kunde inte verifieras.",
    noImage: "Ingen bild laddades upp.",
    invalidImage: "Filen måste vara JPG, PNG eller WebP under 5 MB.",
    parseFailed: "Kupongbilden kunde inte läsas. Prova en tydligare bild.",
    noPicksFound: "Inga spelval hittades i bilden.",
  };
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
      "Use only matches from the provided list that are played today in major leagues. " +
      "Respond only with valid JSON. Write all user-facing text in English."
    );
  }

  return (
    "Du skapar neutrala, datadrivna fotbollskuponger. " +
    "Du får aldrig kalla ett spel säkert, garanterat eller riskfritt. " +
    "Använd endast matcher i listan som spelas idag i större ligor. " +
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

Slip profiles in this order (safest first — tier 1 to 5):

1. Easy (tier 1 — easiest / most conservative)
2. Fairly easy (tier 2)
3. Medium (tier 3)
4. Hard (tier 4)
5. Very hard (tier 5 — hardest / most aggressive)

For each slip set title and risk to exactly the profile name above (e.g. "Easy", "Hard").

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

Use only matches played today (Stockholm time) from major leagues in this list:

${JSON.stringify(fixtures, null, 2)}

Respond exactly in this JSON structure:

{
  "slips": [
    {
      "title": "Easy",
      "risk": "Easy",
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

Kupongprofiler i denna ordning (säkrast först — nivå 1 till 5):

1. Lätt (nivå 1 — enklast / mest konservativ)
2. Medel-lätt (nivå 2)
3. Medel (nivå 3)
4. Svår (nivå 4)
5. Väldigt svår (nivå 5 — svårast / mest offensiv)

Sätt title och risk till exakt profilnamnet ovan (t.ex. "Lätt", "Svår").

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

Använd endast matcher som spelas idag (Stockholm-tid) i större ligor från denna lista:

${JSON.stringify(fixtures, null, 2)}

Svara exakt enligt denna JSON-struktur:

{
  "slips": [
    {
      "title": "Lätt",
      "risk": "Lätt",
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
        "There are not enough matches today in major leagues to create today's slips.",
      createFailed: "Today's slips could not be created.",
      regenerateFailed: (generated: number, limit: number) =>
        `AI created only ${generated} of ${limit} slips. Try again.`,
    };
  }

  return {
    mustLogin: "Du måste vara inloggad.",
    authFailed: "Inloggningen kunde inte verifieras.",
    notEnoughFixtures:
      "Det finns inte tillräckligt många matcher idag i större ligor för att skapa dagens kuponger.",
    createFailed: "Dagens kuponger kunde inte skapas.",
    regenerateFailed: (generated: number, limit: number) =>
      `AI skapade endast ${generated} av ${limit} kuponger. Försök igen.`,
  };
}

export const DAILY_SLIPS_VERSION = 3;

export type SlipPickMeta = {
  match?: string;
  market?: string;
  probability?: number;
  estimatedOdds?: number;
  reason?: string;
  fixtureId?: number;
  kickoffAt?: string;
  isMeta?: boolean;
  metaLanguage?: Language;
  metaVersion?: number;
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
      metaVersion: DAILY_SLIPS_VERSION,
    },
  ];
}

export function getSlipVersion(picks: SlipPickMeta[]): number | null {
  const meta = picks.find((pick) => pick.isMeta);

  return typeof meta?.metaVersion === "number" ? meta.metaVersion : null;
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
