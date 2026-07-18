import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { fetchFootballApi } from "@/lib/footballApiFetch";
import {
  brainScoreToSafetyTier,
  fixtureResultFromApi,
  isFixtureFinished,
  resolvePickOutcome,
  type PickOutcome,
} from "@/lib/pickOutcomeResolver";

export type PublicTrackPickRow = {
  id: string;
  source_type: "daily_slip" | "analysis";
  source_ref: string | null;
  fixture_id: number;
  match_label: string;
  market: string;
  brain_score: number | null;
  safety_tier: number | null;
  probability: number | null;
  published_at: string;
  kickoff_at: string | null;
  outcome: PickOutcome;
  resolved_at: string | null;
  note: string | null;
};

export type TrackRecordStats = {
  resolved: number;
  hits: number;
  misses: number;
  voids: number;
  pending: number;
  hitRate: number | null;
  byTier: Array<{
    tier: number;
    resolved: number;
    hits: number;
    hitRate: number | null;
  }>;
};

let adminClient: SupabaseClient | null = null;

export function getTrackRecordAdmin() {
  if (adminClient) {
    return adminClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  adminClient = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}

export function isMissingTrackRecordTable(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" &&
          error &&
          "message" in error &&
          typeof error.message === "string"
        ? error.message
        : "";

  return /public_track_picks|does not exist|schema cache/i.test(message);
}

export async function insertPublicTrackPick(input: {
  sourceType: "daily_slip" | "analysis";
  sourceRef?: string;
  fixtureId: number;
  matchLabel: string;
  market: string;
  brainScore?: number | null;
  safetyTier?: number | null;
  probability?: number | null;
  kickoffAt?: string | null;
  note?: string | null;
}) {
  const supabase = getTrackRecordAdmin();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("public_track_picks")
    .insert({
      source_type: input.sourceType,
      source_ref: input.sourceRef || null,
      fixture_id: input.fixtureId,
      match_label: input.matchLabel,
      market: input.market,
      brain_score: input.brainScore ?? null,
      safety_tier: input.safetyTier ?? null,
      probability: input.probability ?? null,
      kickoff_at: input.kickoffAt ?? null,
      note: input.note ?? null,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    if (!isMissingTrackRecordTable(error)) {
      console.error("Could not insert public track pick:", error);
    }

    return null;
  }

  return data?.id || null;
}

export async function fetchPublicTrackPicks(limit = 40) {
  const supabase = getTrackRecordAdmin();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("public_track_picks")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (!isMissingTrackRecordTable(error)) {
      console.error("Could not fetch public track picks:", error);
    }

    return [];
  }

  return (data || []) as PublicTrackPickRow[];
}

export function computeTrackRecordStats(
  rows: PublicTrackPickRow[]
): TrackRecordStats {
  const resolvedRows = rows.filter((row) =>
    ["won", "lost", "void"].includes(row.outcome)
  );
  const hits = resolvedRows.filter((row) => row.outcome === "won").length;
  const misses = resolvedRows.filter((row) => row.outcome === "lost").length;
  const voids = resolvedRows.filter((row) => row.outcome === "void").length;
  const pending = rows.filter((row) => row.outcome === "pending").length;
  const scored = hits + misses;
  const hitRate = scored > 0 ? Number(((hits / scored) * 100).toFixed(1)) : null;

  const byTier = [1, 2, 3, 4, 5].map((tier) => {
    const tierRows = resolvedRows.filter(
      (row) => Number(row.safety_tier || 3) === tier
    );
    const tierHits = tierRows.filter((row) => row.outcome === "won").length;
    const tierScored = tierRows.filter((row) =>
      ["won", "lost"].includes(row.outcome)
    ).length;

    return {
      tier,
      resolved: tierRows.length,
      hits: tierHits,
      hitRate:
        tierScored > 0
          ? Number(((tierHits / tierScored) * 100).toFixed(1))
          : null,
    };
  });

  return {
    resolved: resolvedRows.length,
    hits,
    misses,
    voids,
    pending,
    hitRate,
    byTier,
  };
}

export function buildCalibrationPromptNote(
  stats: TrackRecordStats,
  language: "sv" | "en"
) {
  if (!stats.hitRate || stats.resolved < 8) {
    return language === "en"
      ? "Historical public pick sample is still too small for strong calibration."
      : "Historiskt urval av publicerade tips är ännu för litet för stark kalibrering.";
  }

  const tierNotes = stats.byTier
    .filter((tier) => tier.hitRate != null && tier.resolved >= 3)
    .map((tier) =>
      language === "en"
        ? `Tier ${tier.tier}: ${tier.hitRate}% hit (${tier.hits}/${tier.resolved})`
        : `Nivå ${tier.tier}: ${tier.hitRate}% träff (${tier.hits}/${tier.resolved})`
    )
    .join("; ");

  if (language === "en") {
    return `Public track record: ${stats.hitRate}% hit on ${stats.hits}/${stats.hits + stats.misses} resolved picks.${tierNotes ? ` By tier: ${tierNotes}.` : ""} Stay conservative when current setup resembles missed tiers.`;
  }

  return `Publik track record: ${stats.hitRate}% träff på ${stats.hits}/${stats.hits + stats.misses} avgjorda tips.${tierNotes ? ` Per nivå: ${tierNotes}.` : ""} Var extra försiktig när dagens setup liknar nivåer med lägre träff.`;
}

export async function resolvePendingTrackPicks(limit = 20) {
  const supabase = getTrackRecordAdmin();

  if (!supabase) {
    return { updated: 0, skipped: 0 };
  }

  const { data, error } = await supabase
    .from("public_track_picks")
    .select("*")
    .eq("outcome", "pending")
    .order("kickoff_at", { ascending: true })
    .limit(limit);

  if (error) {
    if (!isMissingTrackRecordTable(error)) {
      console.error("Could not load pending track picks:", error);
    }

    return { updated: 0, skipped: 0 };
  }

  let updated = 0;
  let skipped = 0;

  for (const row of (data || []) as PublicTrackPickRow[]) {
    try {
      const response = await fetchFootballApi(
        `fixtures?id=${row.fixture_id}`,
        0,
        { cache: "no-store" }
      );
      const payload = await response.json();
      const fixture = payload?.response?.[0];
      const result = fixtureResultFromApi(fixture);

      if (!result) {
        skipped += 1;
        continue;
      }

      if (!isFixtureFinished(result.status)) {
        skipped += 1;
        continue;
      }

      const outcome = resolvePickOutcome(row.market, result);

      if (outcome === "pending") {
        skipped += 1;
        continue;
      }

      const { error: updateError } = await supabase
        .from("public_track_picks")
        .update({
          outcome,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", row.id);

      if (updateError) {
        console.error("Could not update track pick outcome:", updateError);
        skipped += 1;
        continue;
      }

      updated += 1;
    } catch (resolveError) {
      console.error("Track pick resolve failed:", resolveError);
      skipped += 1;
    }
  }

  return { updated, skipped };
}

export async function getTrackRecordCalibrationNote(language: "sv" | "en") {
  await resolvePendingTrackPicks(12);
  const rows = await fetchPublicTrackPicks(120);
  const stats = computeTrackRecordStats(rows);

  return buildCalibrationPromptNote(stats, language);
}

export { brainScoreToSafetyTier };
