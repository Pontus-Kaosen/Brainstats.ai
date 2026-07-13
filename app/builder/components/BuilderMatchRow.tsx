"use client";

import Image from "next/image";
import { useLanguage } from "@/components/LanguageProvider";
import { getLocale } from "@/lib/locale";
import {
  FINISHED_STATUSES,
  LIVE_STATUSES,
  type MappedFixture,
} from "@/lib/footballFixtures";

type BuilderMatchRowProps = {
  fixture: MappedFixture;
  selected?: boolean;
  inSlip?: boolean;
  onClick?: () => void;
};

export default function BuilderMatchRow({
  fixture,
  selected = false,
  inSlip = false,
  onClick,
}: BuilderMatchRowProps) {
  const { t, language } = useLanguage();
  const locale = getLocale(language);
  const kickoff = new Date(fixture.fixture.date);
  const status = fixture.fixture.status?.short || "";

  const time = kickoff.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isLive = LIVE_STATUSES.has(status);
  const isFinished = FINISHED_STATUSES.has(status);

  const score =
    fixture.goals?.home != null && fixture.goals?.away != null
      ? `${fixture.goals.home}–${fixture.goals.away}`
      : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition sm:gap-4 sm:px-4 ${
        selected
          ? "border-[#18ff6d] bg-[#18ff6d]/10"
          : "border-white/8 bg-black/30 hover:border-[#18ff6d]/40"
      } ${inSlip ? "ring-1 ring-[#18ff6d]/30" : ""}`}
    >
      <div className="w-14 shrink-0 text-center sm:w-16">
        {isLive ? (
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-1 text-[10px] font-bold text-red-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
              {fixture.fixture.status?.elapsed ?? "LIVE"}'
            </span>
            {score ? (
              <p className="mt-1 text-sm font-black text-white">{score}</p>
            ) : null}
          </div>
        ) : (
          <div>
            <p className="text-sm font-bold text-white">{time}</p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#777]">
              {isFinished ? t.builder.matchFinished : t.builder.matchUpcoming}
            </p>
            {score ? (
              <p className="mt-1 text-xs font-bold text-[#A9A9A9]">{score}</p>
            ) : null}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {fixture.teams.home.logo ? (
            <Image
              src={fixture.teams.home.logo}
              alt=""
              width={24}
              height={24}
              className="h-6 w-6 shrink-0 object-contain"
            />
          ) : null}
          <p
            className={`truncate text-sm font-semibold sm:text-base ${
              selected ? "text-white" : "text-[#E8E8E8]"
            }`}
          >
            {fixture.teams.home.name}
          </p>
        </div>

        <div className="mt-1.5 flex items-center gap-2">
          {fixture.teams.away.logo ? (
            <Image
              src={fixture.teams.away.logo}
              alt=""
              width={24}
              height={24}
              className="h-6 w-6 shrink-0 object-contain"
            />
          ) : null}
          <p className="truncate text-sm text-[#A9A9A9] sm:text-base">
            {fixture.teams.away.name}
          </p>
        </div>
      </div>

      <span
        className={`hidden shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-bold sm:inline-flex ${
          inSlip
            ? "border-[#18ff6d] bg-[#18ff6d]/20 text-[#18ff6d]"
            : selected
              ? "border-[#18ff6d]/50 bg-[#18ff6d]/10 text-[#18ff6d]"
              : "border-white/10 bg-black/40 text-[#777]"
        }`}
      >
        {inSlip
          ? t.fixtureCard.inSlipBadge
          : selected
            ? t.builder.buildPickCta
            : t.fixtureCard.select}
      </span>
    </button>
  );
}
