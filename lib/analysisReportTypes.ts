import type { PlayerLineupStatus } from "@/lib/lineups";
import type {
  RotationRisk,
  ScheduleContextStatus,
} from "@/lib/matchImportance";

export type ScoreBreakdown = {
  form?: number;
  table?: number;
  h2h?: number;
  stats?: number;
  market?: number;
  confidence?: number;
};

export type LastMatch = {
  fixture: { id: number; date?: string };
  teams: {
    home: { id?: number; name: string; winner?: boolean | null };
    away: { id?: number; name: string; winner?: boolean | null };
  };
  goals: { home: number | null; away: number | null };
};

export type Injury = {
  player?: {
    id?: number;
    name?: string;
    photo?: string;
    type?: string;
    reason?: string;
  };
  team?: { id?: number; name?: string; logo?: string };
  type?: string;
  reason?: string;
};

export type LineupPlayer = {
  id?: number;
  name?: string;
  number?: number;
  position?: string;
  grid?: string;
};

export type TeamLineup = {
  team?: {
    id?: number;
    name?: string;
    logo?: string;
  };
  formation?: string | null;
  coach?: {
    id?: number;
    name?: string;
    photo?: string;
  };
  startXI?: LineupPlayer[];
  substitutes?: LineupPlayer[];
};

export type Weather = {
  city?: string;
  temperature?: string | number;
  temp?: string | number;
  description?: string;
  condition?: string;
  wind?: string | number;
  windSpeed?: string | number;
  humidity?: string | number;
};

export type TableRowSnapshot = {
  rank?: number;
  points?: number;
  played?: number;
  won?: number;
  draw?: number;
  lost?: number;
  goalsFor?: number;
  goalsAgainst?: number;
  form?: string;
  teamName?: string;
};

export type SeasonRecordSnapshot = {
  form?: string;
  played?: number;
  playedHome?: number;
  playedAway?: number;
  wins?: number;
  winsHome?: number;
  winsAway?: number;
  draws?: number;
  losses?: number;
  goalsFor?: number | string;
  goalsAgainst?: number | string;
  goalsForAvg?: number | string;
  goalsAgainstAvg?: number | string;
  goalsForHome?: number | string;
  goalsForAway?: number | string;
  goalsAgainstHome?: number | string;
  goalsAgainstAway?: number | string;
  cleanSheets?: number;
  cleanSheetsHome?: number;
  failedToScore?: number;
  failedToScoreAway?: number;
  penaltyScored?: number;
  penaltyMissed?: number;
  formation?: string | null;
};

export type ApiPrediction = {
  winner?: { id?: number | null; name?: string | null; comment?: string | null } | null;
  winOrDraw?: boolean | null;
  underOver?: string | null;
  advice?: string | null;
  percent?: { home?: string | null; draw?: string | null; away?: string | null } | null;
  goals?: { home?: string | number | null; away?: string | number | null } | null;
  comparison?: {
    form?: { home?: string | null; away?: string | null } | null;
    attack?: { home?: string | null; away?: string | null } | null;
    defense?: { home?: string | null; away?: string | null } | null;
    poisson?: { home?: string | null; away?: string | null } | null;
    h2h?: { home?: string | null; away?: string | null } | null;
    goals?: { home?: string | null; away?: string | null } | null;
    total?: { home?: string | null; away?: string | null } | null;
  } | null;
};

export type FixtureTeamStatistics = {
  teamId?: number | null;
  teamName?: string | null;
  stats?: Record<string, string | number | null>;
};

export type FixtureEvent = {
  time?: number | null;
  extra?: number | null;
  team?: string | null;
  player?: string | null;
  assist?: string | null;
  type?: string | null;
  detail?: string | null;
};

export type LeagueLeader = {
  id?: number | null;
  name?: string | null;
  photo?: string | null;
  team?: string | null;
  value?: number | null;
};

export type RecentMatchStatsPack = {
  fixtureId: number;
  stats: FixtureTeamStatistics[];
};

export type CoachSnapshot = {
  name?: string | null;
  nationality?: string | null;
  since?: string | null;
};

export type MatchPlayerHighlight = {
  name: string;
  rating?: string | null;
  goals?: number;
  assists?: number;
};

export type AnalysisUsedData = {
  fixtureId?: number | string | null;
  homeTeamId?: string | null;
  awayTeamId?: string | null;
  leagueId?: number | null;
  season?: number | null;
  hasFixture?: boolean;
  hasHomeStats?: boolean;
  hasAwayStats?: boolean;
  hasStandings?: boolean;
  hasH2H?: boolean;
  hasHomeLastMatches?: boolean;
  hasAwayLastMatches?: boolean;
  hasInjuries?: boolean;
  hasLineups?: boolean;
  confirmedLineups?: boolean;
  playerLineupStatus?: PlayerLineupStatus | null;
  lastMatches?: {
    home?: LastMatch[];
    away?: LastMatch[];
  };
  homeLastMatches?: LastMatch[];
  awayLastMatches?: LastMatch[];
  injuries?: Injury[];
  lineups?: TeamLineup[];
  h2h?: LastMatch[];
  headToHead?: LastMatch[];
  homeStanding?: TableRowSnapshot | null;
  awayStanding?: TableRowSnapshot | null;
  homeSeason?: SeasonRecordSnapshot | null;
  awaySeason?: SeasonRecordSnapshot | null;
  weather?: Weather | null;
  oddsAvailable?: boolean;
  prediction?: ApiPrediction | null;
  fixtureStatistics?: FixtureTeamStatistics[];
  fixtureEvents?: FixtureEvent[];
  recentMatchStats?: RecentMatchStatsPack[];
  topScorers?: LeagueLeader[];
  topAssists?: LeagueLeader[];
  dataQuality?: unknown;
  referee?: string | null;
  fixtureDate?: string | null;
  homeCoach?: CoachSnapshot | null;
  awayCoach?: CoachSnapshot | null;
  homeMatchHighlights?: MatchPlayerHighlight[];
  awayMatchHighlights?: MatchPlayerHighlight[];
  rotationRisks?: RotationRisk[];
  scheduleContext?: ScheduleContextStatus | null;
  scheduleTeamsChecked?: string[];
};
