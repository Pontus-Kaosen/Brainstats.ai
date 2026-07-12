"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AIBetSlip from "@/components/AIBetSlip";

type SlipPick = {
    fixture?: string;
    match?: string;
    market?: string;
    probability?: number;
    estimatedOdds?: number;
    reason?: string;
  };

type DailySlip = {
  id: string;
  valid_date: string;
  slip_index: number;
  title: string;
  risk: string;
  confidence: number;
  picks: SlipPick[];
};

type DailySlipsResponse = {
  success?: boolean;
  plan?: "free" | "pro" | "elite";
  slipLimit?: number;
  slips?: DailySlip[];
  error?: string;
};

export default function DailySlipsSection() {
  const [slips, setSlips] = useState<DailySlip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [slipLimit, setSlipLimit] = useState(1);

  useEffect(() => {
    let cancelled = false;

    async function loadDailySlips() {
      setLoading(true);
      setError("");

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error("Du måste vara inloggad.");
        }

        const response = await fetch("/api/daily-slips", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          cache: "no-store",
        });

        const data =
          (await response.json()) as DailySlipsResponse;

        if (!response.ok || data.success === false) {
          throw new Error(
            data.error || "Kupongerna kunde inte hämtas."
          );
        }

        if (cancelled) return;

        setSlips(data.slips || []);
        setSlipLimit(data.slipLimit || 1);
      } catch (loadError) {
        console.error("Daily slips error:", loadError);

        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Kupongerna kunde inte hämtas."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDailySlips();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="mt-14">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="brain-title text-sm font-bold uppercase tracking-[0.3em]">
            Daily Intelligence
          </p>

          <h2 className="mt-3 text-4xl font-black">
            🧠 Dagens AI-kuponger
          </h2>

          <p className="mt-3 max-w-2xl text-[#A9A9A9]">
            Färdiga AI-kuponger med olika riskprofil och
            estimerade fair odds.
          </p>
        </div>

        <div className="rounded-full border border-[#18ff6d33] bg-[#18ff6d]/10 px-5 py-3 text-sm font-bold text-[#18ff6d]">
          {slips.length} av {slipLimit} tillgängliga
        </div>
      </div>

      <p className="mt-4 text-sm text-[#777]">
        AI-estimerade fair odds. Inte liveodds och inga resultat
        är garanterade.
      </p>

      {loading && (
        <div className="mt-8 rounded-3xl border border-[#18ff6d22] bg-black/30 p-8 text-center">
          <p className="font-semibold text-[#18ff6d]">
            Skapar dagens AI-kuponger...
          </p>

          <p className="mt-2 text-sm text-[#A9A9A9]">
            Första laddningen kan ta några sekunder.
          </p>
        </div>
      )}

      {!loading && error && (
        <div className="mt-8 rounded-3xl border border-red-500/30 bg-red-500/10 p-6">
          <p className="font-bold text-red-300">
            Kupongerna kunde inte laddas
          </p>

          <p className="mt-2 text-sm text-red-200/80">
            {error}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 rounded-2xl border border-red-400/40 px-5 py-3 font-bold text-red-200"
          >
            Försök igen
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="mt-8 grid gap-7 xl:grid-cols-2">
          {slips.map((slip) => (
            <AIBetSlip
              key={slip.id}
              title={slip.title}
              confidence={slip.confidence}
              risk={slip.risk}
              picks={slip.picks.map((pick) => ({
                fixture: pick.fixture || pick.match || "Okänd match",
                market: pick.market || "Okänd marknad",
                odds: Number(pick.estimatedOdds || 1),
                reason: pick.reason,
              }))}
            />
          ))}
        </div>
      )}

      {!loading && !error && slips.length < slipLimit && (
        <p className="mt-6 text-sm text-yellow-200">
          Färre kuponger än väntat skapades. Ladda om sidan för
          ett nytt försök.
        </p>
      )}
    </section>
  );
}