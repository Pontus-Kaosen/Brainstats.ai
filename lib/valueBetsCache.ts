export type CachedValueBetPick = {
  match: string;
  market: string;
  fixtureId: number;
  kickoffAt: string | null;
  league?: string;
  fairProbability?: number;
  fairOdds?: number;
  marketOdds?: number;
  impliedProbability?: number;
  edgePercent?: number;
  reason?: string;
  valueTier?: number;
  valueRank?: number;
  valueScore?: number;
};

export function isValueBetStillPlaceable(
  kickoffAt: string | null | undefined,
  nowMs: number = Date.now()
) {
  if (!kickoffAt) {
    return true;
  }

  const kickoffMs = new Date(kickoffAt).getTime();

  if (!Number.isFinite(kickoffMs)) {
    return true;
  }

  return kickoffMs > nowMs;
}

export function filterPlaceableValueBets<T extends { kickoffAt?: string | null }>(
  picks: T[]
) {
  return picks.filter((pick) => isValueBetStillPlaceable(pick.kickoffAt));
}

export function parseStoredValueBetPicks(raw: unknown): CachedValueBetPick[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter(
    (item): item is CachedValueBetPick =>
      !!item &&
      typeof item === "object" &&
      typeof (item as CachedValueBetPick).match === "string" &&
      typeof (item as CachedValueBetPick).market === "string" &&
      typeof (item as CachedValueBetPick).fixtureId === "number"
  );
}

export const VALUE_BET_REGEN_COOLDOWN_MS = 45 * 60 * 1000;

export type ValueBetsCacheRow = {
  picks: unknown;
  fixture_scope?: string | null;
  reference_date_key?: string | null;
  created_at?: string | null;
};

export function canRegenerateValueBetsCache(
  cached: ValueBetsCacheRow | null | undefined,
  placeableCount: number,
  nowMs: number = Date.now()
) {
  if (!cached) {
    return true;
  }

  if (placeableCount > 0) {
    return false;
  }

  const stored = parseStoredValueBetPicks(cached.picks);
  const createdMs = cached.created_at
    ? new Date(cached.created_at).getTime()
    : 0;
  const cooldownPassed =
    !createdMs || nowMs - createdMs >= VALUE_BET_REGEN_COOLDOWN_MS;

  if (!cooldownPassed) {
    return false;
  }

  return stored.length === 0 || placeableCount === 0;
}
