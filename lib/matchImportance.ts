export const IMPORTANT_TOURNAMENT_IDS = new Set([
  1, // World Cup
  2, // Champions League
  3, // Europa League
  4, // Euro Championship
  5, // Nations League
  9, // Copa America
  848, // Conference League
]);

const TOP_LEAGUE_IDS = new Set([
  39, // Premier League
  140, // La Liga
  135, // Serie A
  78, // Bundesliga
  61, // Ligue 1
  94, // Primeira Liga
  88, // Eredivisie
]);

const TOURNAMENT_IMPORTANCE: Record<number, number> = {
  1: 95,
  2: 100,
  3: 90,
  4: 95,
  5: 80,
  9: 85,
  848: 85,
};

export type RotationRisk = {
  teamId: number;
  teamName: string;
  currentLeague: string;
  currentImportance: number;
  upcomingFixtureId: number;
  upcomingDate: string;
  upcomingLeague: string;
  upcomingImportance: number;
  daysAfter: number;
  isBefore: boolean;
};

type FixtureLike = {
  fixture?: { id?: number; date?: string };
  league?: { id?: number; name?: string; type?: string };
  teams?: {
    home?: { id?: number; name?: string };
    away?: { id?: number; name?: string };
  };
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function calendarDayDiff(from: Date, to: Date) {
  const msPerDay = 86_400_000;
  return Math.round(
    (startOfDay(to).getTime() - startOfDay(from).getTime()) / msPerDay
  );
}

export function getLeagueImportance(
  leagueId: number,
  leagueType?: string | null
) {
  if (IMPORTANT_TOURNAMENT_IDS.has(leagueId)) {
    return TOURNAMENT_IMPORTANCE[leagueId] ?? 85;
  }

  if (leagueType === "Cup") {
    return 70;
  }

  if (TOP_LEAGUE_IDS.has(leagueId)) {
    return 60;
  }

  return 45;
}

function isNeutralMarket(text: string) {
  return (
    /över\s+\d/i.test(text) ||
    /under\s+\d/i.test(text) ||
    /over\s+\d/i.test(text) ||
    /under\s+\d/i.test(text) ||
    /båda lagen gör mål/i.test(text) ||
    /both teams to score/i.test(text) ||
    /\boavgjort\b/i.test(text) ||
    /\bdraw\b/i.test(text) ||
    /dubbelchans/i.test(text) ||
    /double chance/i.test(text) ||
    /^över hörnor$/i.test(text.trim()) ||
    /^under hörnor$/i.test(text.trim()) ||
    /^over corners$/i.test(text.trim()) ||
    /^under corners$/i.test(text.trim()) ||
    /^över gula kort$/i.test(text.trim()) ||
    /^under gula kort$/i.test(text.trim()) ||
    /^over yellow cards$/i.test(text.trim()) ||
    /^under yellow cards$/i.test(text.trim()) ||
    /över\s+[\d.]+\s*hörnor/i.test(text) ||
    /under\s+[\d.]+\s*hörnor/i.test(text) ||
    /over\s+[\d.]+\s*corners/i.test(text) ||
    /under\s+[\d.]+\s*corners/i.test(text) ||
    /över\s+[\d.]+\s*gula kort/i.test(text) ||
    /under\s+[\d.]+\s*gula kort/i.test(text) ||
    /over\s+[\d.]+\s*yellow cards/i.test(text) ||
    /under\s+[\d.]+\s*yellow cards/i.test(text)
  );
}

function extractMarketFromBlock(block: string) {
  const lines = block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (/^(fixture|home team|away team|player)\b/i.test(line)) {
      continue;
    }

    if (index === 0 && line.includes(" - ")) {
      continue;
    }

    return line;
  }

  return "";
}

function resolveBetSidesSingle(
  text: string,
  homeName: string,
  awayName: string
): Set<"home" | "away"> {
  const sides = new Set<"home" | "away">();
  const marketText = text.trim();

  if (!marketText || isNeutralMarket(marketText)) {
    return sides;
  }

  if (
    /hemmalag vinner/i.test(marketText) ||
    /home win/i.test(marketText) ||
    /hemmalag hörnor/i.test(marketText) ||
    /home corners/i.test(marketText) ||
    /hemmalag flest kort/i.test(marketText) ||
    /home most cards/i.test(marketText) ||
    /draw no bet.*hem/i.test(marketText) ||
    /draw no bet.*home/i.test(marketText)
  ) {
    sides.add("home");
  }

  if (
    /bortalag vinner/i.test(marketText) ||
    /away win/i.test(marketText) ||
    /bortalag hörnor/i.test(marketText) ||
    /away corners/i.test(marketText) ||
    /bortalag flest kort/i.test(marketText) ||
    /away most cards/i.test(marketText) ||
    /draw no bet.*bort/i.test(marketText) ||
    /draw no bet.*away/i.test(marketText)
  ) {
    sides.add("away");
  }

  if (homeName) {
    const homePattern = new RegExp(escapeRegExp(homeName), "i");

    if (
      homePattern.test(marketText) &&
      (/spelare|player|målskytt|scorer|assist|skott|shot/i.test(marketText) ||
        (/vinner|win/i.test(marketText) &&
          !/bortalag|away/i.test(marketText)))
    ) {
      sides.add("home");
    }
  }

  if (awayName) {
    const awayPattern = new RegExp(escapeRegExp(awayName), "i");

    if (
      awayPattern.test(marketText) &&
      (/spelare|player|målskytt|scorer|assist|skott|shot/i.test(marketText) ||
        (/vinner|win/i.test(marketText) &&
          !/hemmalag|home/i.test(marketText)))
    ) {
      sides.add("away");
    }
  }

  return sides;
}

function extractBetBlocks(text: string) {
  if (/fixture id:/i.test(text)) {
    return text
      .split(/\n\s*\n/)
      .map((block) => block.trim())
      .filter(Boolean);
  }

  return [text];
}

export function resolveBetSides(
  text: string,
  homeName: string,
  awayName: string
): Set<"home" | "away"> {
  const sides = new Set<"home" | "away">();

  for (const block of extractBetBlocks(text)) {
    const marketLine = extractMarketFromBlock(block);
    const scopes = marketLine ? [marketLine, block] : [block];

    for (const scope of scopes) {
      for (const side of resolveBetSidesSingle(scope, homeName, awayName)) {
        sides.add(side);
      }
    }
  }

  return sides;
}

export type ScheduleContextStatus =
  | "risks_found"
  | "checked_clear"
  | "no_team"
  | "no_fixture";

export function getScheduleContextStatus({
  hasFixture,
  betTeams,
  rotationRisks,
}: {
  hasFixture: boolean;
  betTeams: Array<{ id: number; name: string }>;
  rotationRisks: RotationRisk[];
}): ScheduleContextStatus {
  if (!hasFixture) {
    return "no_fixture";
  }

  if (betTeams.length === 0) {
    return "no_team";
  }

  if (rotationRisks.length > 0) {
    return "risks_found";
  }

  return "checked_clear";
}

export function findRotationRisks({
  currentFixture,
  upcomingFixturesByTeam,
  recentFixturesByTeam,
  betTeams,
  windowDays = 7,
}: {
  currentFixture: FixtureLike;
  upcomingFixturesByTeam: Map<number, FixtureLike[]>;
  recentFixturesByTeam?: Map<number, FixtureLike[]>;
  betTeams: Array<{ id: number; name: string }>;
  windowDays?: number;
}): RotationRisk[] {
  if (!currentFixture?.fixture?.date) {
    return [];
  }

  const currentDate = new Date(currentFixture.fixture.date);
  const currentFixtureId = currentFixture.fixture.id;
  const currentLeagueId = currentFixture.league?.id ?? 0;
  const currentLeagueName = currentFixture.league?.name ?? "Unknown";
  const currentImportance = getLeagueImportance(
    currentLeagueId,
    currentFixture.league?.type
  );

  const risks: RotationRisk[] = [];

  for (const team of betTeams) {
    const fixtureSources = [
      ...(upcomingFixturesByTeam.get(team.id) ?? []),
      ...(recentFixturesByTeam?.get(team.id) ?? []),
    ];

    for (const fixture of fixtureSources) {
      if (!fixture?.fixture?.date || fixture.fixture.id === currentFixtureId) {
        continue;
      }

      const fixtureDate = new Date(fixture.fixture.date);
      const dayDiff = calendarDayDiff(currentDate, fixtureDate);
      const absDays = Math.abs(dayDiff);

      if (absDays === 0 || absDays > windowDays) {
        continue;
      }

      const upcomingLeagueId = fixture.league?.id ?? 0;
      const upcomingImportance = getLeagueImportance(
        upcomingLeagueId,
        fixture.league?.type
      );

      const isMajorUpcoming =
        IMPORTANT_TOURNAMENT_IDS.has(upcomingLeagueId);
      const isMoreImportant = upcomingImportance > currentImportance + 8;
      const isMajorBefore =
        dayDiff < 0 && IMPORTANT_TOURNAMENT_IDS.has(upcomingLeagueId);

      if (!isMajorUpcoming && !isMoreImportant && !isMajorBefore) {
        continue;
      }

      risks.push({
        teamId: team.id,
        teamName: team.name,
        currentLeague: currentLeagueName,
        currentImportance,
        upcomingFixtureId: fixture.fixture.id ?? 0,
        upcomingDate: fixture.fixture.date,
        upcomingLeague: fixture.league?.name ?? "Unknown",
        upcomingImportance,
        daysAfter: dayDiff,
        isBefore: dayDiff < 0,
      });
    }
  }

  return risks
    .filter(
      (risk, index, all) =>
        all.findIndex(
          (item) =>
            item.teamId === risk.teamId &&
            item.upcomingFixtureId === risk.upcomingFixtureId
        ) === index
    )
    .sort(
      (a, b) => Math.abs(a.daysAfter) - Math.abs(b.daysAfter)
    );
}

export function summarizeRotationRisksForPrompt(
  risks: RotationRisk[],
  language: "sv" | "en"
) {
  if (risks.length === 0) {
    return language === "en"
      ? "No significant schedule congestion or rotation risk detected in the next 7 days for the bet-relevant team(s)."
      : "Ingen tydlig matchschema- eller rotationsrisk hittades inom 7 dagar för det/de lag spelidén gäller.";
  }

  return risks
    .map((risk) => {
      const date = new Date(risk.upcomingDate).toLocaleDateString(
        language === "en" ? "en-GB" : "sv-SE",
        {
          weekday: "short",
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }
      );

      if (language === "en") {
        if (risk.isBefore) {
          return `- ${risk.teamName} played ${risk.upcomingLeague} ${Math.abs(risk.daysAfter)} day(s) before this match (${date}). Possible fatigue or hangover from a more important fixture. Current match: ${risk.currentLeague}.`;
        }

        return `- ${risk.teamName} have ${risk.upcomingLeague} in ${risk.daysAfter} day(s) after this match (${date}). This match (${risk.currentLeague}) may be deprioritised with possible rotation or reduced intensity — especially relevant if the bet requires this team to win or perform strongly.`;
      }

      if (risk.isBefore) {
        return `- ${risk.teamName} spelade ${risk.upcomingLeague} ${Math.abs(risk.daysAfter)} dag(ar) före denna match (${date}). Möjlig trötthet eller fokus på viktigare match nyligen. Nuvarande match: ${risk.currentLeague}.`;
      }

      return `- ${risk.teamName} har ${risk.upcomingLeague} ${risk.daysAfter} dag(ar) efter denna match (${date}). Denna match (${risk.currentLeague}) kan prioriteras lägre med rotations- eller vilorisk — särskilt relevant om spelet kräver att laget vinner eller presterar starkt.`;
    })
    .join("\n");
}

export function summarizeRotationRisksForUi(
  risks: RotationRisk[],
  language: "sv" | "en"
) {
  return summarizeRotationRisksForPrompt(risks, language)
    .split("\n")
    .map((line) => line.replace(/^- /, "").trim())
    .filter(Boolean);
}
