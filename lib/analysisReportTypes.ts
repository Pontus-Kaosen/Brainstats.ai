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
  wins?: number;
  draws?: number;
  losses?: number;
  goalsFor?: number | string;
  goalsAgainst?: number | string;
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
  lastMatches?: {
    home?: LastMatch[];
    away?: LastMatch[];
  };
  homeLastMatches?: LastMatch[];
  awayLastMatches?: LastMatch[];
  homeLastMatches?: LastMatch[];
  awayLastMatches?: LastMatch[];
  injuries?: Injury[];
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
  dataQuality?: unknown;
  referee?: string | null;
  rotationRisks?: RotationRisk[];
  rotationRisks?: RotationRisk[];
  scheduleContext?:
    | ScheduleContextStatus
    | "checked_clear"
    | "no_team"
    | "no_fixture";
  scheduleContext?:
    | ScheduleContextStatus
    | "checked_clear"
    | "no_team"
    | "no_fixture";
  scheduleTeamsChecked?: string[];
  scheduleTeamsChecked?: string[];
};
