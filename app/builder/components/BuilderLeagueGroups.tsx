"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import BuilderMatchRow from "./BuilderMatchRow";
import { useLanguage } from "@/components/LanguageProvider";
import { formatTranslation } from "@/lib/locale";
import {
  groupFixturesByLeague,
  partitionLeagueGroups,
  type MappedFixture,
} from "@/lib/footballFixtures";

type LeagueGroup = {
  league: MappedFixture["league"];
  fixtures: MappedFixture[];
};

type BuilderLeagueGroupsProps = {
  fixtures: MappedFixture[];
  selectedFixtureId: number | null;
  isInSlip: (fixture: MappedFixture) => boolean;
  onSelectFixture: (fixture: MappedFixture) => void;
  collapseOtherLeagues?: boolean;
  loadingMoreLeagues?: boolean;
  resetCollapseKey?: string;
};

function LeagueGroupSection({
  group,
  selectedFixtureId,
  isInSlip,
  onSelectFixture,
}: {
  group: LeagueGroup;
  selectedFixtureId: number | null;
  isInSlip: (fixture: MappedFixture) => boolean;
  onSelectFixture: (fixture: MappedFixture) => void;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/8 bg-black/20">
      <div className="flex items-center gap-3 border-b border-white/8 bg-black/30 px-3 py-3 sm:px-4">
        {group.league.logo ? (
          <Image
            src={group.league.logo}
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 rounded-lg bg-white p-0.5 object-contain"
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-sm">
            🏆
          </div>
        )}

        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white sm:text-base">
            {group.league.name}
          </p>
          {group.league.country ? (
            <p className="truncate text-xs text-[#777]">
              {group.league.country}
            </p>
          ) : null}
        </div>

        <span className="ml-auto shrink-0 rounded-full border border-[#18ff6d33] bg-[#18ff6d]/10 px-2.5 py-1 text-[11px] font-bold text-[#18ff6d]">
          {group.fixtures.length}
        </span>
      </div>

      <div className="space-y-2 p-2 sm:p-3">
        {group.fixtures.map((fixture) => (
          <BuilderMatchRow
            key={fixture.fixture.id}
            fixture={fixture}
            selected={fixture.fixture.id === selectedFixtureId}
            inSlip={isInSlip(fixture)}
            onClick={() => onSelectFixture(fixture)}
          />
        ))}
      </div>
    </section>
  );
}

export default function BuilderLeagueGroups({
  fixtures,
  selectedFixtureId,
  isInSlip,
  onSelectFixture,
  collapseOtherLeagues = false,
  loadingMoreLeagues = false,
  resetCollapseKey = "",
}: BuilderLeagueGroupsProps) {
  const { t } = useLanguage();
  const [showOtherLeagues, setShowOtherLeagues] = useState(false);
  const groups = groupFixturesByLeague(fixtures);
  const { majorGroups, otherGroups } = partitionLeagueGroups(groups);

  useEffect(() => {
    setShowOtherLeagues(false);
  }, [resetCollapseKey]);

  const shouldCollapse =
    collapseOtherLeagues && otherGroups.length > 0 && !showOtherLeagues;
  const visibleGroups = shouldCollapse ? majorGroups : groups;
  const otherMatchCount = otherGroups.reduce(
    (total, group) => total + group.fixtures.length,
    0
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      {visibleGroups.map((group) => (
        <LeagueGroupSection
          key={group.league.id}
          group={group}
          selectedFixtureId={selectedFixtureId}
          isInSlip={isInSlip}
          onSelectFixture={onSelectFixture}
        />
      ))}

      {shouldCollapse ? (
        <button
          type="button"
          onClick={() => setShowOtherLeagues(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm font-semibold text-white transition hover:border-[#18ff6d55] hover:bg-[#18ff6d]/5"
        >
          {loadingMoreLeagues
            ? t.builder.showMoreLeaguesLoading
            : formatTranslation(t.builder.showMoreLeagues, {
                count: String(otherGroups.length),
                matches: String(otherMatchCount),
              })}
        </button>
      ) : null}
    </div>
  );
}
