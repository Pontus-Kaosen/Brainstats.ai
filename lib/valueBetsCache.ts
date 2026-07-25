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
