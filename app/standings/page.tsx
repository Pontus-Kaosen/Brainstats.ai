"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import FootballBackground from "@/components/FootballBackground";
import BuilderPicker from "@/components/BuilderPicker";
import StandingsTable, { type StandingRow } from "@/components/StandingsTable";
import { useLanguage } from "@/components/LanguageProvider";

type Country = {
  name: string;
  code: string;
  flag: string;
};

type League = {
  id: number;
  name: string;
  type: string;
  country: string;
  logo: string;
  currentSeason?: number;
};

type StandingsResponse = {
  success?: boolean;
  leagueName?: string | null;
  leagueLogo?: string | null;
  country?: string | null;
  season?: string;
  standings?: StandingRow[];
  error?: string;
};

const ALL_COUNTRIES_VALUE = "__all_countries__";
const TOURNAMENTS_VALUE = "__tournaments__";
const POPULAR_LEAGUE_IDS = [39, 140, 135, 78, 61, 113];
const TOURNAMENT_IDS = new Set([1, 2, 3, 4, 5, 9, 848]);

export default function StandingsPage() {
  const { t } = useLanguage();

  const [countries, setCountries] = useState<Country[]>([]);
  const [allLeagues, setAllLeagues] = useState<League[]>([]);
  const [country, setCountry] = useState<string>(ALL_COUNTRIES_VALUE);
  const [search, setSearch] = useState("");
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [tableMeta, setTableMeta] = useState<{
    leagueName: string;
    leagueLogo: string | null;
    season: string;
  } | null>(null);
  const [loadingLeagues, setLoadingLeagues] = useState(true);
  const [loadingTable, setLoadingTable] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      setLoadingLeagues(true);
      setError("");

      try {
        const [countriesRes, leaguesRes] = await Promise.all([
          fetch("/api/football/countries"),
          fetch("/api/football/leagues"),
        ]);

        const countriesData = await countriesRes.json();
        const leaguesData = await leaguesRes.json();

        if (cancelled) return;

        if (!countriesRes.ok || !leaguesRes.ok) {
          throw new Error(t.standings.loadError);
        }

        setCountries(countriesData.countries || []);
        setAllLeagues(leaguesData.leagues || []);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : t.standings.loadError
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingLeagues(false);
        }
      }
    }

    loadCatalog();

    return () => {
      cancelled = true;
    };
  }, [t.standings.loadError]);

  const filteredLeagues = useMemo(() => {
    const query = search.trim().toLowerCase();

    let base = allLeagues;

    if (country === TOURNAMENTS_VALUE) {
      base = allLeagues.filter((league) => TOURNAMENT_IDS.has(league.id));
    } else if (country !== ALL_COUNTRIES_VALUE) {
      base = allLeagues.filter((league) => league.country === country);
    }

    if (!query) return base;

    return base.filter(
      (league) =>
        league.name.toLowerCase().includes(query) ||
        league.country.toLowerCase().includes(query)
    );
  }, [allLeagues, country, search]);

  const groupedLeagues = useMemo(() => {
    const groups = new Map<string, League[]>();

    for (const league of filteredLeagues) {
      const key = league.country || t.standings.unknownCountry;
      const existing = groups.get(key) || [];
      groups.set(key, [...existing, league]);
    }

    return Array.from(groups.entries()).sort(([a], [b]) =>
      a.localeCompare(b, "sv")
    );
  }, [filteredLeagues, t.standings.unknownCountry]);

  const popularLeagues = useMemo(
    () =>
      POPULAR_LEAGUE_IDS.map((id) =>
        allLeagues.find((league) => league.id === id)
      ).filter((league): league is League => Boolean(league)),
    [allLeagues]
  );

  async function loadStandings(league: League) {
    setSelectedLeague(league);
    setLoadingTable(true);
    setError("");
    setStandings([]);
    setTableMeta(null);

    try {
      const season = league.currentSeason || new Date().getFullYear();
      const response = await fetch(
        `/api/football/standings?league=${league.id}&season=${season}`
      );
      const data = (await response.json()) as StandingsResponse;

      if (!response.ok || data.success === false) {
        throw new Error(data.error || t.standings.tableError);
      }

      setStandings(data.standings || []);
      setTableMeta({
        leagueName: data.leagueName || league.name,
        leagueLogo: data.leagueLogo || league.logo,
        season: String(data.season || season),
      });
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : t.standings.tableError
      );
    } finally {
      setLoadingTable(false);
    }
  }

  const countryOptions = [
    {
      label: t.standings.allCountries,
      value: ALL_COUNTRIES_VALUE,
      icon: "🌍",
    },
    {
      label: t.standings.tournaments,
      value: TOURNAMENTS_VALUE,
      icon: "🏆",
    },
    ...countries.map((item) => ({
      label: item.name,
      value: item.name,
      image: item.flag,
    })),
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-[#FAFAF8]">
      <FootballBackground />

      <div className="relative z-10">
        <Navbar />

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-12">
          <section className="text-center">
            <p className="inline-flex rounded-full border border-[#18ff6d33] bg-[#18ff6d]/10 px-4 py-2 text-sm font-semibold text-[#18ff6d]">
              {t.standings.badge}
            </p>
            <h1 className="mt-5 text-3xl font-black sm:text-5xl">
              {t.standings.title}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-[#A9A9A9]">
              {t.standings.description}
            </p>
          </section>

          <section className="mt-8 grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-6">
            <aside className="rounded-[2rem] border border-white/10 bg-black/30 p-4 sm:p-5">
              <BuilderPicker
                label={t.standings.countryLabel}
                icon="🌍"
                value={country}
                options={countryOptions}
                onChange={setCountry}
              />

              <label className="mt-4 block">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#747474]">
                  {t.standings.searchLabel}
                </span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t.standings.searchPlaceholder}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-[#18ff6d44]"
                />
              </label>

              <div className="mt-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#747474]">
                  {t.standings.popularLeagues}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {popularLeagues.map((league) => (
                    <button
                      key={league.id}
                      type="button"
                      onClick={() => loadStandings(league)}
                      className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                        selectedLeague?.id === league.id
                          ? "border-[#18ff6d] bg-[#18ff6d]/15 text-[#18ff6d]"
                          : "border-white/10 bg-white/[0.03] text-[#D8D8D8] hover:border-[#18ff6d44]"
                      }`}
                    >
                      {league.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 max-h-[520px] overflow-y-auto pr-1">
                {loadingLeagues ? (
                  <p className="text-sm text-[#888]">{t.standings.loadingLeagues}</p>
                ) : groupedLeagues.length === 0 ? (
                  <p className="text-sm text-[#888]">{t.standings.noLeagues}</p>
                ) : (
                  <div className="space-y-5">
                    {groupedLeagues.map(([groupName, leagues]) => (
                      <div key={groupName}>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#18ff6d]">
                          {groupName}
                        </p>
                        <div className="mt-2 space-y-1">
                          {leagues.map((league) => (
                            <button
                              key={league.id}
                              type="button"
                              onClick={() => loadStandings(league)}
                              className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition ${
                                selectedLeague?.id === league.id
                                  ? "border-[#18ff6d44] bg-[#18ff6d]/10"
                                  : "border-transparent hover:border-white/10 hover:bg-white/[0.03]"
                              }`}
                            >
                              {league.logo ? (
                                <Image
                                  src={league.logo}
                                  alt=""
                                  width={24}
                                  height={24}
                                  className="h-6 w-6 shrink-0 object-contain"
                                />
                              ) : (
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/5 text-[10px]">
                                  ⚽
                                </span>
                              )}
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-semibold text-white">
                                  {league.name}
                                </span>
                                <span className="block text-xs text-[#777]">
                                  {league.currentSeason}
                                </span>
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </aside>

            <section className="min-w-0">
              {!selectedLeague && !loadingTable && (
                <div className="flex min-h-[320px] items-center justify-center rounded-[2rem] border border-dashed border-white/10 bg-black/20 p-8 text-center">
                  <p className="max-w-md text-sm leading-7 text-[#888]">
                    {t.standings.pickLeagueHint}
                  </p>
                </div>
              )}

              {loadingTable && (
                <div className="flex min-h-[320px] items-center justify-center rounded-[2rem] border border-[#18ff6d22] bg-black/20 p-8">
                  <p className="text-sm font-semibold text-[#18ff6d]">
                    {t.standings.loadingTable}
                  </p>
                </div>
              )}

              {!loadingTable && selectedLeague && tableMeta && (
                <div>
                  <div className="mb-5 flex flex-wrap items-center gap-4">
                    {tableMeta.leagueLogo ? (
                      <Image
                        src={tableMeta.leagueLogo}
                        alt=""
                        width={48}
                        height={48}
                        className="h-12 w-12 object-contain"
                      />
                    ) : null}
                    <div>
                      <h2 className="text-2xl font-black text-white">
                        {tableMeta.leagueName}
                      </h2>
                      <p className="text-sm text-[#888]">
                        {t.standings.seasonLabel} {tableMeta.season}
                      </p>
                    </div>
                  </div>

                  {standings.length > 0 ? (
                    <StandingsTable rows={standings} labels={t.standings.columns} />
                  ) : (
                    <div className="rounded-[2rem] border border-yellow-500/20 bg-yellow-500/10 p-6 text-sm text-yellow-100">
                      {t.standings.noTableData}
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                  {error}
                </div>
              )}
            </section>
          </section>
        </div>
      </div>
    </main>
  );
}
