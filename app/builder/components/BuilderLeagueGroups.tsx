"use client";

import Image from "next/image";
import BuilderMatchRow from "./BuilderMatchRow";
import {
  groupFixturesByLeague,
  type MappedFixture,
} from "@/lib/footballFixtures";

type BuilderLeagueGroupsProps = {
  fixtures: MappedFixture[];
  selectedFixtureId: number | null;
  isInSlip: (fixture: MappedFixture) => boolean;
  onSelectFixture: (fixture: MappedFixture) => void;
};

export default function BuilderLeagueGroups({
  fixtures,
  selectedFixtureId,
  isInSlip,
  onSelectFixture,
}: BuilderLeagueGroupsProps) {
  const groups = groupFixturesByLeague(fixtures);

  return (
    <div className="space-y-5 sm:space-y-6">
      {groups.map((group) => (
        <section
          key={group.league.id}
          className="overflow-hidden rounded-2xl border border-white/8 bg-black/20"
        >
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
      ))}
    </div>
  );
}
