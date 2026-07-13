"use client";

import Image from "next/image";
import { useLanguage } from "@/components/LanguageProvider";
import { getLocale } from "@/lib/locale";

type Fixture = {
  fixture: {
    id: number;
    date: string;
    venue?: {
      name?: string | null;
      city?: string | null;
    } | null;
    status?: {
      short?: string;
      long?: string;
      elapsed?: number | null;
    };
  };

  league: {
    id: number;
    name: string;
    logo?: string;
    season: number;
  };

  teams: {
    home: {
      id: number;
      name: string;
      logo?: string;
    };

    away: {
      id: number;
      name: string;
      logo?: string;
    };
  };
};

type FormItem = {
  result: "W" | "D" | "L";
};

type StandingItem = {
  rank: number;
  teamId: number;
  points: number;
  goalsDiff: number;
  played: number;
};

type H2HItem = {
  homeWinner?: boolean | null;
  awayWinner?: boolean | null;
  homeGoals?: number | null;
  awayGoals?: number | null;
};

type FixtureCardProps = {
  fixture: Fixture;
  selected?: boolean;
  inSlip?: boolean;
  onClick?: () => void;
  homeForm?: FormItem[];
  awayForm?: FormItem[];
  homeStanding?: StandingItem;
  awayStanding?: StandingItem;
  h2h?: H2HItem[];
};

function formColor(result: FormItem["result"]) {
  if (result === "W") return "bg-green-500/20 text-green-300";
  if (result === "D") return "bg-yellow-500/20 text-yellow-200";
  return "bg-red-500/20 text-red-300";
}

function FormDots({ form }: { form: FormItem[] }) {
  if (form.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-0.5">
      {form.slice(0, 5).map((item, index) => (
        <span
          key={`${item.result}-${index}`}
          className={`flex h-5 w-5 items-center justify-center rounded text-[9px] font-bold ${formColor(
            item.result
          )}`}
        >
          {item.result}
        </span>
      ))}
    </div>
  );
}

export default function FixtureCard({
  fixture,
  selected = false,
  inSlip = false,
  onClick,
  homeForm = [],
  awayForm = [],
  homeStanding,
  awayStanding,
}: FixtureCardProps) {
  const { t, language } = useLanguage();
  const locale = getLocale(language);
  const matchDate = new Date(fixture.fixture.date);

  const date = matchDate.toLocaleDateString(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  const time = matchDate.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const mobileHighlighted = inSlip || selected;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-3xl border p-3 text-left transition-all duration-200 max-md:rounded-2xl max-md:p-2.5 sm:p-5 ${
        selected
          ? "border-[#18ff6d] bg-[#18ff6d]/10"
          : "border-white/10 bg-black/30 hover:border-[#18ff6d]/50"
      } ${mobileHighlighted ? "max-md:border-[#18ff6d] max-md:bg-[#18ff6d]/10" : ""}`}
    >
      <div className="md:hidden">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {fixture.league.logo ? (
              <Image
                src={fixture.league.logo}
                alt={fixture.league.name}
                width={32}
                height={32}
                loading="lazy"
                sizes="32px"
                className="h-7 w-7 shrink-0 rounded-lg bg-white p-0.5 object-contain"
              />
            ) : (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5">
                🏆
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">
                {fixture.league.name}
              </p>

              <p className="text-[10px] text-[#A9A9A9]">
                {date} · {time}
              </p>
            </div>
          </div>

          <span
            className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold ${
              inSlip
                ? "border-[#18ff6d] bg-[#18ff6d]/20 text-[#18ff6d]"
                : "border-[#18ff6d]/30 bg-[#18ff6d]/10 text-[#18ff6d]"
            }`}
          >
            {inSlip ? t.fixtureCard.inSlipBadge : t.fixtureCard.addBadge}
          </span>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            {fixture.teams.home.logo && (
              <Image
                src={fixture.teams.home.logo}
                alt={fixture.teams.home.name}
                width={40}
                height={40}
                loading="lazy"
                sizes="40px"
                className="h-8 w-8 shrink-0 object-contain"
              />
            )}

            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-white">
                {fixture.teams.home.name}
              </p>

              <p className="text-[10px] text-[#18ff6d]">
                {homeStanding
                  ? `#${homeStanding.rank} · ${homeStanding.points}p`
                  : t.fixtureCard.noStandings}
              </p>
            </div>
          </div>

          <span className="shrink-0 rounded-full border border-white/10 bg-black/40 px-2 py-0.5 text-[10px] font-bold text-[#A9A9A9]">
            {t.common.vs}
          </span>

          <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 text-right">
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-white">
                {fixture.teams.away.name}
              </p>

              <p className="text-[10px] text-[#18ff6d]">
                {awayStanding
                  ? `#${awayStanding.rank} · ${awayStanding.points}p`
                  : t.fixtureCard.noStandings}
              </p>
            </div>

            {fixture.teams.away.logo && (
              <Image
                src={fixture.teams.away.logo}
                alt={fixture.teams.away.name}
                width={40}
                height={40}
                loading="lazy"
                sizes="40px"
                className="h-8 w-8 shrink-0 object-contain"
              />
            )}
          </div>
        </div>

        {(homeForm.length > 0 || awayForm.length > 0) && (
          <div className="mt-2 flex items-center justify-between gap-2 border-t border-white/5 pt-2">
            <FormDots form={homeForm} />
            <FormDots form={awayForm} />
          </div>
        )}
      </div>

      <div className="hidden md:block">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            {fixture.league.logo ? (
              <Image
                src={fixture.league.logo}
                alt={fixture.league.name}
                width={40}
                height={40}
                loading="lazy"
                sizes="40px"
                className="h-10 w-10 rounded-xl bg-white p-1 object-contain"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
                🏆
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate font-bold text-white">
                {fixture.league.name}
              </p>

              <p className="mt-1 text-xs text-[#A9A9A9]">
                {date} · {time}
              </p>
            </div>
          </div>

          <span className="rounded-full border border-[#18ff6d]/30 bg-[#18ff6d]/10 px-3 py-2 text-xs font-bold text-[#18ff6d]">
            {selected ? t.fixtureCard.selected : t.fixtureCard.select}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:mt-6 sm:gap-3">
          <div className="min-w-0 text-center">
            {fixture.teams.home.logo && (
              <Image
                src={fixture.teams.home.logo}
                alt={fixture.teams.home.name}
                width={56}
                height={56}
                loading="lazy"
                sizes="64px"
                className="mx-auto h-12 w-12 object-contain sm:h-16 sm:w-16"
              />
            )}

            <p className="mt-3 break-words font-bold text-white">
              {fixture.teams.home.name}
            </p>

            <p className="mt-2 text-xs text-[#18ff6d]">
              {homeStanding
                ? `#${homeStanding.rank} · ${homeStanding.points}p`
                : t.fixtureCard.noStandings}
            </p>

            <div className="mt-2 flex flex-wrap justify-center gap-1 sm:mt-3">
              {homeForm.slice(0, 5).map((item, index) => (
                <span
                  key={`${item.result}-${index}`}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${formColor(
                    item.result
                  )}`}
                >
                  {item.result}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-full border border-white/10 bg-black/40 px-3 py-2 text-xs font-bold text-[#A9A9A9]">
            {t.common.vs}
          </div>

          <div className="min-w-0 text-center">
            {fixture.teams.away.logo && (
              <Image
                src={fixture.teams.away.logo}
                alt={fixture.teams.away.name}
                width={56}
                height={56}
                loading="lazy"
                sizes="64px"
                className="mx-auto h-12 w-12 object-contain sm:h-16 sm:w-16"
              />
            )}

            <p className="mt-3 break-words font-bold text-white">
              {fixture.teams.away.name}
            </p>

            <p className="mt-2 text-xs text-[#18ff6d]">
              {awayStanding
                ? `#${awayStanding.rank} · ${awayStanding.points}p`
                : t.fixtureCard.noStandings}
            </p>

            <div className="mt-2 flex flex-wrap justify-center gap-1 sm:mt-3">
              {awayForm.slice(0, 5).map((item, index) => (
                <span
                  key={`${item.result}-${index}`}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${formColor(
                    item.result
                  )}`}
                >
                  {item.result}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-black/30 p-4 text-center">
          <p className="text-sm font-semibold text-[#18ff6d]">
            {selected
              ? t.fixtureCard.matchSelected
              : t.fixtureCard.tapToSelect}
          </p>
        </div>
      </div>
    </button>
  );
}
