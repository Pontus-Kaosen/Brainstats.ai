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
  fixture: { id: number; date: string };
  teams: {
    home: { id: number; name: string; winner?: boolean | null };
    away: { id: number; name: string; winner?: boolean | null };
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
  temperature?: string | number;
  description?: string;
  wind?: string | number;
  humidity?: string | number;
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
  injuries?: Injury[];
  lineups?: TeamLineup[];
  weather?: Weather | null;
  oddsAvailable?: boolean;
  dataQuality?: unknown;
  referee?: string | null;
  rotationRisks?: RotationRisk[];
  scheduleContext?: ScheduleContextStatus;
  scheduleTeamsChecked?: string[];
};
