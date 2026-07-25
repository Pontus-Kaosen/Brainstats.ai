"use client";

import ValueStars from "@/components/ValueStars";

type ValueBetPick = {
  match: string;
  market: string;
  league: string;
  kickoffAt?: string | null;
  fairProbability: number;
  fairOdds: number;
  marketOdds: number;
  impliedProbability: number;
  edgePercent: number;
  reason: string;
  valueTier?: number;
  valueRank?: number;
};

type ValueBetCardProps = {
  pick: ValueBetPick;
  labels: {
    fairOdds: string;
    marketOdds: string;
    edge: string;
    fairProbability: string;
    impliedProbability: string;
    valueGrade: string;
  };
  gradeLabel?: string;
  rankLabel?: string;
  kickoffLabel?: string | null;
};

export default function ValueBetCard({
  pick,
  labels,
  gradeLabel,
  rankLabel,
  kickoffLabel,
}: ValueBetCardProps) {
  const tier = pick.valueTier ?? 3;

  return (
    <article className="brain-card rounded-3xl border border-[#18ff6d22] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {rankLabel ? (
              <span className="rounded-full border border-[#18ff6d33] bg-[#18ff6d]/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#18ff6d]">
                {rankLabel}
              </span>
            ) : null}
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#72d5ff]">
              {pick.league}
            </p>
          </div>
          <h3 className="mt-2 text-lg font-bold text-white sm:text-xl">{pick.match}</h3>
          {kickoffLabel ? (
            <p className="mt-1 text-xs text-[#777]">{kickoffLabel}</p>
          ) : null}
        </div>

        <span className="rounded-full border border-[#18ff6d55] bg-[#18ff6d]/10 px-3 py-1 text-sm font-black text-[#18ff6d]">
          {labels.edge}: +{pick.edgePercent}%
        </span>
      </div>

      <div className="mt-4 rounded-2xl border border-[#18ff6d22] bg-[#18ff6d]/5 px-4 py-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#777]">
          {labels.valueGrade}
        </p>
        <div className="mt-2">
          <ValueStars tier={tier} label={gradeLabel} />
        </div>
      </div>

      <p className="mt-4 text-base font-semibold text-[#E8DCC8]">{pick.market}</p>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
          <p className="text-[#777]">{labels.fairProbability}</p>
          <p className="mt-1 text-lg font-bold text-white">{pick.fairProbability}%</p>
          <p className="mt-1 text-[#A9A9A9]">
            {labels.fairOdds}: {pick.fairOdds}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
          <p className="text-[#777]">{labels.impliedProbability}</p>
          <p className="mt-1 text-lg font-bold text-white">{pick.impliedProbability}%</p>
          <p className="mt-1 text-[#A9A9A9]">
            {labels.marketOdds}: {pick.marketOdds}
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-[#CFCFCF]">{pick.reason}</p>
    </article>
  );
}
