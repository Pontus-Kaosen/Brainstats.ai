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

export default function FixtureCard({
  fixture,
  selected = false,
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

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-3xl border p-3 text-left transition-all duration-200 max-md:p-4 sm:p-5 ${
        selected
          ? "border-[#18ff6d] bg-[#18ff6d]/10"
          : "border-white/10 bg-black/30 hover:border-[#18ff6d]/50"
      }`}
    >
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

      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 max-md:mt-3 sm:mt-6 sm:gap-3">
        <div className="min-w-0 text-center">
          {fixture.teams.home.logo && (
            <Image
              src={fixture.teams.home.logo}
              alt={fixture.teams.home.name}
              width={56}
              height={56}
              loading="lazy"
              sizes="(max-width: 767px) 48px, 64px"
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

          <div className="mt-2 hidden flex-wrap justify-center gap-1 max-md:hidden sm:mt-3 sm:flex">
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
              sizes="(max-width: 767px) 48px, 64px"
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

          <div className="mt-2 hidden flex-wrap justify-center gap-1 max-md:hidden sm:mt-3 sm:flex">
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
    </button>
  );
}
