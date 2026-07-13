"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import BuilderSlipPanel from "./components/BuilderSlipPanel";
import BuilderHowItWorks from "./components/BuilderHowItWorks";
import BuilderViewTabs, {
  type BuilderViewMode,
} from "./components/BuilderViewTabs";
import BuilderLeagueGroups from "./components/BuilderLeagueGroups";
import BuilderMatchRow from "./components/BuilderMatchRow";
import Navbar from "@/components/Navbar";
import Button from "@/components/Button";
import FootballBackground from "@/components/FootballBackground";
import BuilderPicker from "@/components/BuilderPicker";
import { useLanguage } from "@/components/LanguageProvider";
import {
  formatTranslation,
} from "@/lib/locale";
import { useIsMobile } from "@/lib/useMediaQuery";
import {
  areLineupsConfirmed,
  getPlayerLineupStatus,
  getPlayerLineupStatusLabel,
  hasPartialLineups,
} from "@/lib/lineups";
import {
  addDaysToDateKey,
  getFixtureStockholmDateKey,
  getStockholmDateKey,
} from "@/lib/stockholmDate";

const TOURNAMENTS_VALUE = "__tournaments__";

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

type Fixture = {
  fixture: {
    id: number;
    date: string;
    referee?: string | null;
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
    season: number;
    name: string;
    logo?: string;
    country?: string;
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

  goals?: {
    home: number | null;
    away: number | null;
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

type Player = {
  id: number;
  name: string;
  position?: string;
};

type LineupPlayer = {
  id?: number;
  name?: string;
  number?: number;
  position?: string;
  grid?: string;
};

type TeamLineup = {
  team?: {
    id?: number;
    name?: string;
    logo?: string;
  };
  formation?: string | null;
  coach?: {
    id?: number;
    name?: string;
    photo?: string;
  };
  startXI?: LineupPlayer[];
  substitutes?: LineupPlayer[];
};

type SlipItem = {
  fixtureId: number;
  leagueId: number;
  season: number;
  date: string;
  homeTeamId: number;
  awayTeamId: number;
  homeTeam: string;
  awayTeam: string;
  market: string;
  playerId?: number | null;
  playerName?: string;
};

const tournamentIds = [1, 2, 3, 4, 5, 9, 848];

function isPlayerMarket(market: string) {
  return market.startsWith("Spelare") || market.startsWith("Player");
}

function isCornerMarketValue(market: string) {
  return market.includes("hörnor") || market.toLowerCase().includes("corner");
}

export default function BuilderPage() {
  const { t, language } = useLanguage();
  const isMobile = useIsMobile();
  const fixturePreviewLimit = isMobile ? 4 : 8;
  const liveRefreshMs = isMobile ? 120_000 : 60_000;
  const markets = t.builder.markets;

  const dateOptions = useMemo(
    () => [
      {
        label: t.builder.dateAll,
        value: "all",
        icon: "📅",
        description: t.builder.dateAllDescription,
      },
      {
        label: t.builder.dateToday,
        value: "today",
        icon: "🔥",
        description: t.builder.dateTodayDescription,
      },
      {
        label: t.builder.dateTomorrow,
        value: "tomorrow",
        icon: "⏭️",
        description: t.builder.dateTomorrowDescription,
      },
      {
        label: t.builder.dateWeek,
        value: "week",
        icon: "🗓️",
        description: t.builder.dateWeekDescription,
      },
    ],
    [t]
  );
  const [countries, setCountries] = useState<Country[]>([]);
  const [allLeagues, setAllLeagues] = useState<League[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [liveFixtures, setLiveFixtures] = useState<Fixture[]>([]);
  const [loadingLive, setLoadingLive] = useState(true);
  const [liveError, setLiveError] = useState("");

  const [forms, setForms] = useState<Record<number, FormItem[]>>({});
  const [standings, setStandings] = useState<
    Record<number, StandingItem>
  >({});
  const [h2hMap, setH2hMap] = useState<Record<number, H2HItem[]>>({});

  const [country, setCountry] = useState(TOURNAMENTS_VALUE);
  const [leagueId, setLeagueId] = useState<number | null>(null);
  const [selectedFixtureId, setSelectedFixtureId] = useState<
    number | null
  >(null);

  const [market, setMarket] = useState<string>(markets[0]);

  useEffect(() => {
    setMarket(t.builder.markets[0]);
  }, [language]);
  const [viewMode, setViewMode] = useState<BuilderViewMode>("today");
  const [dateFilter, setDateFilter] = useState("all");

  const fixtureFetchDate = useMemo(() => {
    const todayKey = getStockholmDateKey();

    if (viewMode === "today" || dateFilter === "today") {
      return todayKey;
    }

    if (viewMode === "tomorrow" || dateFilter === "tomorrow") {
      return addDaysToDateKey(todayKey, 1);
    }

    return null;
  }, [viewMode, dateFilter]);
  const [search, setSearch] = useState("");

  const [playerName, setPlayerName] = useState("");
  const [playerId, setPlayerId] = useState<number | null>(null);
  const [playerLine, setPlayerLine] = useState("1+");
  const [cornerLine, setCornerLine] = useState("8.5");
  const [playerTeam, setPlayerTeam] = useState<"home" | "away">("home");
  const [homePlayers, setHomePlayers] = useState<Player[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);

  const [lineups, setLineups] = useState<TeamLineup[]>([]);
  const [loadingLineups, setLoadingLineups] = useState(false);
  const [lineupError, setLineupError] = useState("");

  const [slip, setSlip] = useState<SlipItem[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [matchError, setMatchError] = useState("");

  const selectedLeague = leagues.find(
    (league) => league.id === leagueId
  );

  const selectedSeason =
    selectedLeague?.currentSeason || new Date().getFullYear();

  const selectedFixture =
    fixtures.find(
      (fixture) => fixture.fixture.id === selectedFixtureId
    ) ||
    liveFixtures.find(
      (fixture) => fixture.fixture.id === selectedFixtureId
    );

  const isPlayerProp = isPlayerMarket(market);
  const isCornerMarket = isCornerMarketValue(market);

  const selectedPlayers =
    playerTeam === "home" ? homePlayers : awayPlayers;

  const selectedPlayerTeamId = selectedFixture
    ? playerTeam === "home"
      ? selectedFixture.teams.home.id
      : selectedFixture.teams.away.id
    : null;

  const lineupsConfirmed = useMemo(
    () => areLineupsConfirmed(lineups),
    [lineups]
  );

  const partialLineupsPublished = useMemo(
    () => hasPartialLineups(lineups),
    [lineups]
  );

  const publishedLineups = useMemo(
    () =>
      lineups.filter((lineup) => (lineup.startXI?.length ?? 0) > 0),
    [lineups]
  );

  const selectedPlayerLineupStatus = useMemo(() => {
    if (!playerId || !isPlayerProp) {
      return null;
    }

    return getPlayerLineupStatus(
      playerId,
      lineups,
      selectedPlayerTeamId
    );
  }, [playerId, isPlayerProp, lineups, selectedPlayerTeamId]);

    useEffect(() => {
      let cancelled = false;
      const controller = new AbortController();
    
      const timeoutId = window.setTimeout(() => {
        controller.abort();
      }, 15000);
    
      async function loadOptions() {
        setLoadingOptions(true);
    
        try {
          const [countriesResponse, leaguesResponse] = await Promise.all([
            fetch("/api/football/countries", {
              cache: "no-store",
              signal: controller.signal,
            }),
            fetch("/api/football/leagues", {
              cache: "no-store",
              signal: controller.signal,
            }),
          ]);
    
          const countriesData = await countriesResponse.json();
          const leaguesData = await leaguesResponse.json();
    
          if (!countriesResponse.ok || countriesData.success === false) {
            throw new Error(
              countriesData.error || t.builder.errors.countries
            );
          }
    
          if (!leaguesResponse.ok || leaguesData.success === false) {
            throw new Error(
              leaguesData.error || t.builder.errors.leagues
            );
          }
    
          if (cancelled) return;
    
          const nextCountries = Array.isArray(countriesData.countries)
            ? countriesData.countries
            : [];
    
          const nextLeagues = Array.isArray(leaguesData.leagues)
            ? leaguesData.leagues
            : [];
    
          setCountries(nextCountries);
          setAllLeagues(nextLeagues);
    
          if (nextLeagues.length === 0) {
            console.error("Inga ligor returnerades:", leaguesData);
          }
        } catch (error) {
          console.error("Kunde inte hämta länder och ligor:", error);
    
          if (!cancelled) {
            setCountries([]);
            setAllLeagues([]);
          }
        } finally {
          window.clearTimeout(timeoutId);
    
          if (!cancelled) {
            setLoadingOptions(false);
          }
        }
      }
    
      loadOptions();
    
      return () => {
        cancelled = true;
        controller.abort();
        window.clearTimeout(timeoutId);
      };
    }, []);

  useEffect(() => {
    let cancelled = false;
  
    async function loadLive() {
      setLoadingLive(true);
      setLiveError("");
  
      try {
        const response = await fetch("/api/football/live", {
          method: "GET",
          cache: "no-store",
        });
  
        const data = await response.json();
  
        if (!response.ok || data.success !== true) {
          throw new Error(
            data.error || t.builder.errors.live
          );
        }
  
        if (!cancelled) {
          setLiveFixtures(
            Array.isArray(data.fixtures) ? data.fixtures : []
          );
        }
      } catch (error) {
        console.error("LIVE BUILDER ERROR:", error);
  
        if (!cancelled) {
          setLiveFixtures([]);
          setLiveError(
            error instanceof Error
              ? error.message
              : t.builder.errors.live
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingLive(false);
        }
      }
    }
  
    loadLive();
  
    const intervalId = window.setInterval(loadLive, liveRefreshMs);
  
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [liveRefreshMs, t.builder.errors.live]);

  useEffect(() => {
    if (allLeagues.length === 0) return;

    let filtered: League[];

    if (country === TOURNAMENTS_VALUE || country === t.builder.tournaments) {
      filtered = tournamentIds
        .map((id) => allLeagues.find((league) => league.id === id))
        .filter((league): league is League => Boolean(league));
    } else {
      filtered = allLeagues.filter(
        (league) => league.country === country
      );
    }

    setLeagues(filtered);
    setFixtures([]);
    setForms({});
    setStandings({});
    setH2hMap({});
    setSelectedFixtureId(null);
    setMatchError("");
    setSearch("");

    if (filtered.length > 0) {
      setLeagueId(filtered[0].id);
    } else {
      setLeagueId(null);
    }
  }, [country, allLeagues]);

  const loadExtraMatchData = useCallback(
    async (items: Fixture[], currentLeagueId: number, season: number) => {
      const visibleFixtures = items.slice(0, Math.min(items.length, 12));

      const teamIds = Array.from(
        new Set(
          visibleFixtures.flatMap((fixture) => [
            fixture.teams.home.id,
            fixture.teams.away.id,
          ])
        )
      );

      const [standingsResult, formResults, h2hResults] = await Promise.all([
        fetch(
          `/api/football/standings?league=${currentLeagueId}&season=${season}`
        )
          .then((response) => response.json())
          .catch((error) => {
            console.error("Standings kunde inte hämtas:", error);
            return null;
          }),
        Promise.allSettled(
          teamIds.map(async (teamId) => {
            const response = await fetch(
              `/api/football/form?team=${teamId}&season=${season}`
            );

            const data = await response.json();

            return {
              teamId,
              form: data.form || [],
            };
          })
        ),
        Promise.allSettled(
          visibleFixtures.map(async (fixture) => {
            const response = await fetch(
              `/api/football/h2h?home=${fixture.teams.home.id}&away=${fixture.teams.away.id}`
            );

            const data = await response.json();

            const h2h = (data.matches || []).map((match: any) => ({
              homeWinner: match.teams.home.winner,
              awayWinner: match.teams.away.winner,
              homeGoals: match.goals.home,
              awayGoals: match.goals.away,
            }));

            return {
              fixtureId: fixture.fixture.id,
              h2h,
            };
          })
        ),
      ]);

      if (standingsResult) {
        const standingsRecord: Record<number, StandingItem> = {};

        (standingsResult.standings || []).forEach((team: StandingItem) => {
          standingsRecord[team.teamId] = team;
        });

        setStandings(standingsRecord);
      }

      const formRecord: Record<number, FormItem[]> = {};

      formResults.forEach((result) => {
        if (result.status === "fulfilled") {
          formRecord[result.value.teamId] = result.value.form;
        }
      });

      setForms(formRecord);

      const h2hRecord: Record<number, H2HItem[]> = {};

      h2hResults.forEach((result) => {
        if (result.status === "fulfilled") {
          h2hRecord[result.value.fixtureId] = result.value.h2h;
        }
      });

      setH2hMap(h2hRecord);
    },
    []
  );

  useEffect(() => {
    if (viewMode !== "today" && viewMode !== "tomorrow") {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    const date =
      viewMode === "today"
        ? getStockholmDateKey()
        : addDaysToDateKey(getStockholmDateKey(), 1);

    async function loadByDate() {
      setLoadingMatches(true);
      setMatchError("");
      setFixtures([]);
      setForms({});
      setStandings({});
      setH2hMap({});

      try {
        const response = await fetch(
          `/api/football/fixtures/by-date?date=${date}`,
          { signal: controller.signal }
        );

        const data = await response.json();

        if (!response.ok || data.success === false) {
          throw new Error(data.error || t.builder.errors.fixtures);
        }

        const items: Fixture[] = data.fixtures || [];
        setFixtures(items);
      } catch (error: any) {
        const message =
          error?.name === "AbortError"
            ? t.builder.errors.fixturesTimeout
            : error?.message || t.builder.errors.fixtures;

        console.error("Builder by-date error:", error);
        setMatchError(message);
        setFixtures([]);
      } finally {
        setLoadingMatches(false);
        window.clearTimeout(timeout);
      }
    }

    loadByDate();

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [viewMode, t.builder.errors.fixtures, t.builder.errors.fixturesTimeout]);

  useEffect(() => {
    if (viewMode !== "league" || !leagueId || !selectedSeason) {
      return;
    }

    const currentLeagueId = leagueId;
    const season = selectedSeason;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);

    async function loadFixtures() {
      setLoadingMatches(true);
      setMatchError("");
      setFixtures([]);
      setForms({});
      setStandings({});
      setH2hMap({});
      setSelectedFixtureId(null);

      try {
        const dateQuery = fixtureFetchDate
          ? `&date=${fixtureFetchDate}`
          : "";

        const response = await fetch(
          `/api/football/fixtures?league=${currentLeagueId}&season=${season}${dateQuery}`,
          {
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!response.ok || data.success === false) {
          throw new Error(data.error || t.builder.errors.fixtures);
        }

        const items: Fixture[] = data.fixtures || [];

        setFixtures(items);
        setLoadingMatches(false);

        if (items.length === 0) {
          return;
        }

        void loadExtraMatchData(
          items.slice(0, fixturePreviewLimit),
          currentLeagueId,
          season
        );
      } catch (error: any) {
        const message =
          error?.name === "AbortError"
            ? t.builder.errors.fixturesTimeout
            : error?.message || t.builder.errors.fixtures;

        console.error("Builder fixture error:", error);

        setMatchError(message);
        setFixtures([]);
        setSelectedFixtureId(null);
        setLoadingMatches(false);
      } finally {
        window.clearTimeout(timeout);
      }
    }

    loadFixtures();

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [
    viewMode,
    leagueId,
    selectedSeason,
    fixtureFetchDate,
    fixturePreviewLimit,
    loadExtraMatchData,
    t.builder.errors.fixtures,
    t.builder.errors.fixturesTimeout,
  ]);

  useEffect(() => {
    if (!selectedFixture || !isPlayerProp) {
      setHomePlayers([]);
      setAwayPlayers([]);
      setPlayerName("");
      setPlayerId(null);
      return;
    }

    let cancelled = false;

    async function loadPlayers() {
      try {
        const [homeResponse, awayResponse] = await Promise.all([
          fetch(
            `/api/football/players?team=${selectedFixture!.teams.home.id}`
          ),
          fetch(
            `/api/football/players?team=${selectedFixture!.teams.away.id}`
          ),
        ]);

        const homeData = await homeResponse.json();
        const awayData = await awayResponse.json();

        if (cancelled) return;

        const nextHomePlayers = homeData.players || [];
        const nextAwayPlayers = awayData.players || [];

        setHomePlayers(nextHomePlayers);
        setAwayPlayers(nextAwayPlayers);
        setPlayerTeam("home");
        setPlayerName(nextHomePlayers[0]?.name || "");
        setPlayerId(nextHomePlayers[0]?.id || null);
      } catch (error) {
        console.error("Spelare kunde inte hämtas:", error);
      }
    }

    loadPlayers();

    return () => {
      cancelled = true;
    };
  }, [selectedFixtureId, isPlayerProp]);

  useEffect(() => {
    if (!selectedFixtureId) {
      setLineups([]);
      setLineupError("");
      setLoadingLineups(false);
      return;
    }

    let cancelled = false;

    async function loadLineups() {
      setLoadingLineups(true);
      setLineupError("");
      setLineups([]);

      try {
        const response = await fetch(
          `/api/football/lineups?fixture=${selectedFixtureId}`,
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok || data.success === false) {
          throw new Error(
            data.error || t.builder.errors.lineups
          );
        }

        if (cancelled) return;

        setLineups(Array.isArray(data.lineups) ? data.lineups : []);
      } catch (error) {
        console.error("Startelvor kunde inte hämtas:", error);

        if (!cancelled) {
          setLineupError(
            error instanceof Error
              ? error.message
              : t.builder.errors.lineups
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingLineups(false);
        }
      }
    }

    loadLineups();

    return () => {
      cancelled = true;
    };
  }, [selectedFixtureId]);

  const filteredFixtures = useMemo(() => {
    const sourceFixtures = viewMode === "live" ? liveFixtures : fixtures;
    const todayKey = getStockholmDateKey();
    const tomorrowKey = addDaysToDateKey(todayKey, 1);
    const weekEndKey = addDaysToDateKey(todayKey, 7);

    return sourceFixtures.filter((fixture) => {
      const searchableText = `
        ${fixture.teams.home.name}
        ${fixture.teams.away.name}
        ${fixture.league.name}
        ${fixture.league.country || ""}
      `.toLowerCase();

      const matchesSearch = searchableText.includes(
        search.trim().toLowerCase()
      );

      if (viewMode === "today" || viewMode === "tomorrow" || viewMode === "live") {
        return matchesSearch;
      }

      const fixtureDateKey = getFixtureStockholmDateKey(fixture.fixture.date);

      let matchesDate = true;

      if (dateFilter === "today") {
        matchesDate = fixtureDateKey === todayKey;
      }

      if (dateFilter === "tomorrow") {
        matchesDate = fixtureDateKey === tomorrowKey;
      }

      if (dateFilter === "week") {
        matchesDate =
          fixtureDateKey >= todayKey && fixtureDateKey < weekEndKey;
      }

      return matchesSearch && matchesDate;
    });
  }, [fixtures, liveFixtures, search, dateFilter, viewMode]);

  function selectFixture(fixture: Fixture) {
    setSelectedFixtureId(fixture.fixture.id);
    setLeagueId(fixture.league.id);
  }

  function isFixtureSelectedInSlip(fixture: Fixture) {
    return slip.some((item) => item.fixtureId === fixture.fixture.id);
  }

  function buildMarketText(fixture?: Fixture) {
    if (isPlayerProp && fixture) {
      return `${market}: ${
        playerTeam === "home"
          ? fixture.teams.home.name
          : fixture.teams.away.name
      } · ${playerName || t.builder.unknownPlayer} · ${playerLine}`;
    }

    return market;
  }

  function isFixtureInSlip(fixture: Fixture) {
    const marketText = buildMarketText(fixture);

    return slip.some(
      (item) =>
        item.fixtureId === fixture.fixture.id && item.market === marketText
    );
  }

  function addFixtureToSlip(fixture: Fixture) {
    selectFixture(fixture);

    const marketText = buildMarketText(fixture);

    const item: SlipItem = {
      fixtureId: fixture.fixture.id,
      leagueId: fixture.league.id,
      season: fixture.league.season,
      date: fixture.fixture.date,
      homeTeamId: fixture.teams.home.id,
      awayTeamId: fixture.teams.away.id,
      homeTeam: fixture.teams.home.name,
      awayTeam: fixture.teams.away.name,
      market: marketText,
      playerId: isPlayerProp ? playerId : null,
      playerName: isPlayerProp ? playerName : undefined,
    };

    setSlip((current) => {
      const exists = current.some(
        (existing) =>
          existing.fixtureId === item.fixtureId &&
          existing.market === item.market
      );

      return exists ? current : [...current, item];
    });
  }

  function addSelectedToSlip() {
    if (!selectedFixture) return;
    addFixtureToSlip(selectedFixture);
  }

  function analyze() {
    if (slip.length === 0) return;

    const text = slip
      .map(
        (item) => `${item.homeTeam} - ${item.awayTeam}
${item.market}
Fixture ID: ${item.fixtureId}
Home Team ID: ${item.homeTeamId}
Away Team ID: ${item.awayTeamId}
${item.playerId ? `Player ID: ${item.playerId}` : ""}
${item.playerName ? `Player Name: ${item.playerName}` : ""}`
      )
      .join("\n\n");

    window.location.href =
      "/analyze?text=" + encodeURIComponent(text);
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#050505] text-[#FAFAF8]">
      <FootballBackground />

      <div className="relative z-10">
        <Navbar />

        <div className="mx-auto max-w-7xl px-3 py-4 sm:px-8 sm:py-10">
          <section className="mb-4 max-md:mb-3 sm:mb-10">
            <p className="brain-title text-sm font-semibold max-md:text-xs">
              {t.builder.pageBadge}
            </p>

            <h1 className="mt-1 text-2xl font-black leading-tight max-md:mt-0 sm:mt-2 sm:text-5xl">
              {t.builder.pageTitle}
            </h1>

            <p className="mt-4 hidden max-w-2xl text-[#A9A9A9] md:block">
              {t.builder.pageDescription}
            </p>
          </section>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px] xl:gap-8">
            <section className="brain-card min-w-0 rounded-3xl p-4 sm:p-8">
              <BuilderViewTabs
                value={viewMode}
                onChange={setViewMode}
                liveCount={liveFixtures.length}
                todayCount={
                  viewMode === "today" ? filteredFixtures.length : undefined
                }
              />

              {viewMode === "league" ? (
                loadingOptions ? (
                  <div className="mt-5 rounded-3xl border border-[#18ff6d22] bg-black/30 p-6 text-center">
                    <p className="text-[#18ff6d]">
                      {t.builder.loadingOptionsLong}
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-5">
                    <BuilderPicker
                      label={t.builder.labels.country}
                      icon="🌍"
                      value={country}
                      onChange={setCountry}
                      options={[
                        {
                          label: t.builder.tournaments,
                          value: TOURNAMENTS_VALUE,
                          icon: "🌍",
                          description: t.builder.tournamentsDescription,
                        },
                        ...countries.map((item) => ({
                          label: item.name,
                          value: item.name,
                          image: item.flag || undefined,
                          description: t.builder.nationalLeaguesDescription,
                        })),
                      ]}
                    />

                    <BuilderPicker
                      label={t.builder.labels.league}
                      icon="🏆"
                      value={leagueId || ""}
                      onChange={(value) => setLeagueId(Number(value))}
                      options={leagues.map((league) => ({
                        label: league.name,
                        value: league.id,
                        image: league.logo || undefined,
                        icon: "🏆",
                        description: league.currentSeason
                          ? formatTranslation(t.builder.seasonLabel, {
                              season: league.currentSeason,
                            })
                          : league.type,
                      }))}
                    />

                    <BuilderPicker
                      label={t.builder.labels.date}
                      icon="📅"
                      value={dateFilter}
                      onChange={setDateFilter}
                      options={dateOptions}
                      searchable={false}
                    />
                  </div>
                )
              ) : null}

              <div className="mt-5 flex flex-col gap-4 sm:mt-6 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="brain-title text-sm font-semibold uppercase tracking-[0.25em]">
                    {t.builder.matchCenter}
                  </p>

                  <h2 className="mt-1 text-xl font-black sm:text-2xl">
                    {t.builder.selectMatch}
                  </h2>

                  <p className="mt-2 text-xs text-[#A9A9A9]">
                    {t.builder.matchTapHint}
                  </p>
                </div>

                <div className="w-full md:w-80">
                  <label className="text-sm text-[#A9A9A9]">
                    {t.builder.searchMatch}
                  </label>

                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={t.builder.searchPlaceholder}
                    className="mt-2 w-full rounded-2xl border border-[#18ff6d22] bg-black/40 p-4 outline-none transition focus:border-[#18ff6d88]"
                  />
                </div>
              </div>

              {viewMode === "live" && liveError ? (
                <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                  {t.builder.liveError} {liveError}
                </div>
              ) : null}

              {viewMode === "live" && loadingLive ? (
                <div className="mt-5 rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-center">
                  <p className="font-bold text-red-300">
                    {t.builder.loadingLive}
                  </p>
                </div>
              ) : viewMode === "live" && filteredFixtures.length === 0 ? (
                <div className="mt-5 rounded-3xl border border-white/10 bg-black/30 p-8">
                  <p className="text-[#A9A9A9]">{t.builder.noLiveMatches}</p>
                </div>
              ) : viewMode !== "live" && loadingMatches ? (
                <div className="mt-5 rounded-3xl border border-[#18ff6d22] bg-black/30 p-8 text-center">
                  <p className="font-semibold text-[#18ff6d]">
                    {viewMode === "today" || viewMode === "tomorrow"
                      ? t.builder.loadingTodayFixtures
                      : t.builder.loadingFixtures}
                  </p>
                </div>
              ) : viewMode !== "live" && matchError ? (
                <div className="mt-5 rounded-3xl border border-red-500/30 bg-red-500/10 p-6">
                  <p className="font-bold text-red-300">
                    {t.builder.fixturesError}
                  </p>
                  <p className="mt-2 text-sm text-red-200/80">{matchError}</p>
                </div>
              ) : viewMode === "league" && !leagueId ? (
                <p className="mt-5 rounded-3xl border border-white/10 bg-black/30 p-6 text-[#A9A9A9]">
                  {t.builder.selectLeagueFirst}
                </p>
              ) : filteredFixtures.length === 0 ? (
                <p className="mt-5 rounded-3xl border border-white/10 bg-black/30 p-6 text-[#A9A9A9]">
                  {viewMode === "today"
                    ? t.builder.noTodayMatches
                    : viewMode === "tomorrow"
                      ? t.builder.noTomorrowMatches
                      : t.builder.noFilteredMatches}
                </p>
              ) : (
                <div className="mt-5 max-h-[52vh] overflow-y-auto overscroll-contain pr-1 sm:max-h-[60vh] md:max-h-[65vh]">
                  <BuilderLeagueGroups
                    fixtures={filteredFixtures}
                    selectedFixtureId={selectedFixtureId}
                    isInSlip={isFixtureSelectedInSlip}
                    onSelectFixture={selectFixture}
                  />
                </div>
              )}

              {selectedFixture ? (
                <section className="mt-6 rounded-3xl border border-[#18ff6d33] bg-[#18ff6d]/5 p-4 sm:p-6">
                  <div className="mb-5">
                    <p className="brain-title text-sm font-semibold uppercase tracking-[0.25em]">
                      {t.builder.buildPickTitle}
                    </p>
                    <p className="mt-2 text-sm text-[#A9A9A9]">
                      {t.builder.buildPickHint}
                    </p>
                  </div>

                  <BuilderMatchRow
                    fixture={selectedFixture}
                    selected
                    inSlip={isFixtureInSlip(selectedFixture)}
                    onClick={() => selectFixture(selectedFixture)}
                  />

                  <div className="mt-5">
                    <BuilderPicker
                      label={t.builder.labels.market}
                      icon="🎯"
                      value={market}
                      onChange={setMarket}
                      options={markets.map((marketOption) => ({
                        label: marketOption,
                        value: marketOption,
                        icon: isPlayerMarket(marketOption)
                          ? "👤"
                          : marketOption.toLowerCase().includes("goal") ||
                              marketOption.includes("mål")
                            ? "⚽"
                            : isCornerMarketValue(marketOption)
                              ? "🚩"
                              : marketOption.toLowerCase().includes("card") ||
                                  marketOption.includes("kort")
                                ? "🟨"
                                : "🎯",
                      }))}
                    />
                  </div>
                </section>
              ) : (
                <p className="mt-6 rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-sm text-[#A9A9A9]">
                  {t.builder.selectMatchFirst}
                </p>
              )}

{selectedFixture && isPlayerProp && (
  <>
  <div className="mt-4 grid grid-cols-1 gap-2 sm:mt-6 sm:grid-cols-2 md:grid-cols-3 sm:gap-5">
    <BuilderPicker
      label={t.builder.labels.team}
      icon="👕"
      value={playerTeam}
      onChange={(value) => {
        const team = value as "home" | "away";
        const players = team === "home" ? homePlayers : awayPlayers;

        setPlayerTeam(team);
        setPlayerName(players[0]?.name || "");
        setPlayerId(players[0]?.id || null);
      }}
      searchable={false}
      options={[
        {
          label: selectedFixture?.teams.home.name || t.analyze.homeTeam,
          value: "home",
          image: selectedFixture?.teams.home.logo,
          description: t.builder.homePlayersDescription,
        },
        {
          label: selectedFixture?.teams.away.name || t.analyze.awayTeam,
          value: "away",
          image: selectedFixture?.teams.away.logo,
          description: t.builder.awayPlayersDescription,
        },
      ]}
    />

    <BuilderPicker
      label={t.builder.labels.player}
      icon="👤"
      value={playerId || ""}
      onChange={(value) => {
        const selected = selectedPlayers.find(
          (player) => player.id === Number(value)
        );

        setPlayerId(selected?.id || null);
        setPlayerName(selected?.name || "");
      }}
      options={selectedPlayers.map((player) => ({
        label: player.name,
        value: player.id,
        icon: "👤",
        description: [
          player.position || t.builder.playerFallback,
          getPlayerLineupStatusLabel(
            getPlayerLineupStatus(
              player.id,
              lineups,
              selectedPlayerTeamId
            ),
            language
          ),
        ].join(" · "),
      }))}
    />

    <BuilderPicker
      label={t.builder.labels.line}
      icon="📏"
      value={playerLine}
      onChange={setPlayerLine}
      searchable={false}
      options={["1+", "2+", "3+", "4+", "5+"].map((line) => ({
        label: line,
        value: line,
        icon: "📏",
        description: formatTranslation(t.builder.playerLineDescription, {
          line,
        }),
      }))}
    />
  </div>

  {selectedPlayerLineupStatus === "bench" && playerName ? (
    <div className="mt-3 rounded-2xl border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm text-yellow-100">
      {formatTranslation(t.builder.playerOnBenchWarning, { name: playerName })}
    </div>
  ) : null}

  {selectedPlayerLineupStatus === "not_in_squad" && playerName ? (
    <div className="mt-3 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100">
      {formatTranslation(t.builder.playerNotStartingWarning, {
        name: playerName,
      })}
    </div>
  ) : null}
  </>
        )}

{selectedFixture && isCornerMarket && (
  <div className="mt-6">
    <label className="text-sm text-[#A9A9A9]">
      🚩 {t.builder.cornerLineLabel}
    </label>

    <select
      value={cornerLine}
      onChange={(e) => setCornerLine(e.target.value)}
      className="mt-2 w-full rounded-2xl bg-black/40 p-4"
    >
      <option>5.5</option>
      <option>6.5</option>
      <option>7.5</option>
      <option>8.5</option>
      <option>9.5</option>
      <option>10.5</option>
      <option>11.5</option>
      <option>12.5</option>
    </select>
  </div>
)}

              {selectedFixture ? (
                <>
              <div className="xl:hidden">
                <BuilderHowItWorks
                  filtersReady={Boolean(selectedFixture && market)}
                  slipCount={slip.length}
                />
              </div>

              <Button
                onClick={addSelectedToSlip}
                disabled={!selectedFixture}
                className="mt-6 w-full"
              >
                {t.builder.addSelectedToSlip}
              </Button>

              <section className="mt-5 rounded-3xl border border-[#18ff6d22] bg-black/25 p-4 sm:mt-8 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="brain-title text-sm font-semibold uppercase tracking-[0.25em]">
                      {t.builder.startingXiBadge}
                    </p>

                    <h2 className="mt-2 text-xl font-black text-white sm:text-2xl">
                      👥 {t.builder.startingXiTitle}
                    </h2>
                  </div>

                  <span
                    className={`w-fit rounded-full border px-4 py-2 text-xs font-bold ${
                      lineupsConfirmed
                        ? "border-[#18ff6d44] bg-[#18ff6d]/10 text-[#18ff6d]"
                        : partialLineupsPublished
                          ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-300"
                          : "border-yellow-500/40 bg-yellow-500/10 text-yellow-300"
                    }`}
                  >
                    {lineupsConfirmed
                      ? t.analyze.confirmed
                      : partialLineupsPublished
                        ? t.builder.partialLineupsPublished
                        : t.builder.awaitingLineups}
                  </span>
                </div>

                {!selectedFixture ? (
                  <p className="mt-5 text-sm text-[#A9A9A9]">
                    {t.builder.selectMatchForLineups}
                  </p>
                ) : loadingLineups ? (
                  <div className="mt-5 rounded-2xl border border-[#18ff6d22] bg-black/30 p-5">
                    <p className="font-semibold text-[#18ff6d]">
                      {t.builder.loadingLineups}
                    </p>
                  </div>
                ) : lineupError ? (
                  <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
                    <p className="font-bold text-red-300">
                      {t.builder.lineupsErrorTitle}
                    </p>

                    <p className="mt-2 text-sm text-red-200/80">
                      {lineupError}
                    </p>
                  </div>
                ) : !partialLineupsPublished ? (
                  <div className="mt-5 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-5">
                    <p className="font-semibold text-yellow-300">
                      {t.analyze.lineupsNotPublished}
                    </p>

                    <p className="mt-2 text-sm leading-6 text-[#A9A9A9]">
                      {t.builder.lineupsPublishHint}
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 grid gap-4 xl:grid-cols-2">
                    {publishedLineups.map((lineup, teamIndex) => (
                      <div
                        key={lineup.team?.id || teamIndex}
                        className="overflow-hidden rounded-2xl border border-[#18ff6d22] bg-black/30"
                      >
                        <div className="flex items-center gap-4 border-b border-white/10 p-5">
                          {lineup.team?.logo && (
                            <img
                              src={lineup.team.logo}
                              alt={lineup.team?.name || t.common.teamAlt}
                              className="h-11 w-11 rounded-full bg-white p-1"
                            />
                          )}

                          <div>
                            <h3 className="font-black text-white">
                              {lineup.team?.name ||
                                (teamIndex === 0
                                  ? t.analyze.homeTeam
                                  : t.analyze.awayTeam)}
                            </h3>

                            <p className="mt-1 text-sm text-[#18ff6d]">
                              {t.analyze.formation}{" "}
                              {lineup.formation || t.analyze.notSpecified}
                            </p>

                            {lineup.coach?.name && (
                              <p className="mt-1 text-xs text-[#A9A9A9]">
                                {t.analyze.coach} {lineup.coach.name}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="p-5">
                          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#777]">
                            {t.analyze.startingPlayers}
                          </p>

                          <div className="mt-4 max-h-48 space-y-2 overflow-y-auto pr-1 sm:max-h-96">
                            {(lineup.startXI || []).map(
                              (player, playerIndex) => (
                                <div
                                  key={
                                    player.id ||
                                    `${player.name}-${playerIndex}`
                                  }
                                  className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                                    isPlayerProp &&
                                    playerId &&
                                    player.id === playerId
                                      ? "border-[#18ff6d] bg-[#18ff6d]/10"
                                      : "border-white/5 bg-[#101010]/80"
                                  }`}
                                >
                                  <div className="flex min-w-0 items-center gap-3">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#18ff6d]/10 text-sm font-black text-[#18ff6d]">
                                      {player.number ?? "–"}
                                    </span>

                                    <span className="truncate font-semibold text-[#E8E8E8]">
                                      {player.name || t.builder.unknownPlayer}
                                    </span>

                                    {isPlayerProp &&
                                    playerId &&
                                    player.id === playerId ? (
                                      <span className="rounded-full bg-[#18ff6d]/20 px-2 py-0.5 text-[10px] font-bold text-[#18ff6d]">
                                        {t.analyze.selectedPlayerBadge}
                                      </span>
                                    ) : null}
                                  </div>

                                  <span className="ml-3 shrink-0 text-xs font-bold text-[#A9A9A9]">
                                    {player.position || "–"}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
                </>
              ) : null}

              <div className="mt-5 brain-card rounded-3xl p-4 xl:hidden">
                <BuilderSlipPanel
                  compact
                  slip={slip}
                  onRemove={(index) =>
                    setSlip((current) =>
                      current.filter((_, itemIndex) => itemIndex !== index)
                    )
                  }
                  onClear={() => setSlip([])}
                  onAnalyze={analyze}
                />
              </div>
            </section>

            <aside className="brain-card hidden h-fit rounded-3xl p-4 sm:p-8 xl:sticky xl:top-6 xl:block">
              <BuilderSlipPanel
                slip={slip}
                onRemove={(index) =>
                  setSlip((current) =>
                    current.filter((_, itemIndex) => itemIndex !== index)
                  )
                }
                onClear={() => setSlip([])}
                onAnalyze={analyze}
              />
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}