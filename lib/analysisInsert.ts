import type { SupabaseClient } from "@supabase/supabase-js";

export async function insertAnalysisWithFallback(
  supabaseAdmin: SupabaseClient,
  row: Record<string, unknown>
) {
  let current = { ...row };

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const { data, error } = await supabaseAdmin
      .from("analyses")
      .insert(current)
      .select();

    if (!error) {
      return { data, error: null };
    }

    const missingColumn = error.message.match(
      /Could not find the '([^']+)' column/i
    );

    if (missingColumn?.[1]) {
      delete current[missingColumn[1]];
      continue;
    }

    if (/worth_betting|used_data|score_breakdown|bet_text/i.test(error.message)) {
      delete current.worth_betting;
      delete current.used_data;
      delete current.score_breakdown;
      delete current.bet_text;
      continue;
    }

    return { data: null, error };
  }

  return {
    data: null,
    error: { message: "Kunde inte spara analysen efter flera försök." },
  };
}
