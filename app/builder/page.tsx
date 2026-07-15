"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import BuilderSlipPanel from "./components/BuilderSlipPanel";
import BuilderHowItWorks from "./components/BuilderHowItWorks";
import BuilderViewTabs, {
  type BuilderViewMode,
} from "./components/BuilderViewTabs";
import BuilderLeagueGroups from "./components/BuilderLeagueGroups";
import BuilderMatchRow from "./components/BuilderMatchRow";
import BuilderMarketGrid from "./components/BuilderMarketGrid";
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
import {
  isCornerOverUnderMarketLabel,
  isCardOverUnderMarketLabel,
  isPlayerMarketLabel,
  CORNER_LINE_OPTIONS,
  CARD_LINE_OPTIONS,
  formatMarketWithLine,
} from "@/lib/builderMarkets";

const TOURNAMENTS_VALUE = "__tournaments__";
const ALL_COUNTRIES_VALUE = "__all_countries__";
const ALL_LEAGUES_VALUE = "__all_leagues__";

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

type PlayerPickDraft = {
  id: string;
  market: string;
  playerTeam: "home" | "away";
  playerId: number;
  playerName: string;
  playerLine: string;
};

const tournamentIds = [1, 2, 3, 4, 5, 9, 848];

function isPlayerMarket(market: string) {
  return isPlayerMarketLabel(market);
}

export default function BuilderPage() {
  const { t, language } = useLanguage();
  const isMobile = useIsMobile();
  const fixturePreviewLimit = isMobile ? 4 : 8;
  const liveRefreshMs = isMobile ? 120_000 : 60_000;
  const markets = t.builder.markets;
  const builderPanelRef = useRef<HTMLElement | null>(null);
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

  const [country, setCountry] = useState(ALL_COUNTRIES_VALUE);
  const [leagueId, setLeagueId] = useState<number | typeof ALL_LEAGUES_VALUE>(
    ALL_LEAGUES_VALUE
  );
  const [selectedFixtureId, setSelectedFixtureId] = useState<
    number | null
  >(null);

  const [market, setMarket] = useState<string>(markets[0]);
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [playerPickDrafts, setPlayerPickDrafts] = useState<PlayerPickDraft[]>(
    []
  );
  const [builderError, setBuilderError] = useState("");

  useEffect(() => {
    setMarket(t.builder.markets[0]);
    setSelectedMarkets([]);
    setPlayerPickDrafts([]);
    setBuilderError("");
  }, [language]);
  const [viewMode, setViewMode] = useState<BuilderViewMode>("today");
  const [search, setSearch] = useState("");

  const [playerName, setPlayerName] = useState("");
  const [playerId, setPlayerId] = useState<number | null>(null);
  const [playerLine, setPlayerLine] = useState("1+");
  const [cornerLine, setCornerLine] = useState("8.5");
  const [cardLine, setCardLine] = useState("3.5");
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

  const specificLeagueId =
    typeof leagueId === "number" ? leagueId : null;

  const selectedLeague =
    allLeagues.find((league) => league.id === specificLeagueId) ||
    leagues.find((league) => league.id === specificLeagueId);

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
  const hasPlayerPickDrafts = playerPickDrafts.length > 0;
  const hasSelectedCornerLineMarkets = selectedMarkets.some(
    isCornerOverUnderMarketLabel
  );
  const hasSelectedCardLineMarkets = selectedMarkets.some(
    isCardOverUnderMarketLabel
  );
  const isActiveCornerLineMarket = isCornerOverUnderMarketLabel(market);
  const isActiveCardLineMarket = isCardOverUnderMarketLabel(market);
  const totalPendingPicks =
    selectedMarkets.length + playerPickDrafts.length;

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

    if (country === ALL_COUNTRIES_VALUE) {
      filtered = [];
    } else if (country === TOURNAMENTS_VALUE || country === t.builder.tournaments) {
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
      setLeagueId(ALL_LEAGUES_VALUE);
    } else {
      setLeagueId(ALL_LEAGUES_VALUE);
    }
  }, [country, allLeagues, t.builder.tournaments]);

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
    if (viewMode === "live") {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 25000);

    async function loadByDates(dates: string[]) {
      const responses = await Promise.all(
        dates.map(async (date) => {
          const response = await fetch(
            `/api/football/fixtures/by-date?date=${date}`,
            { signal: controller.signal }
          );
          const data = await response.json();

          if (!response.ok || data.success === false) {
            throw new Error(data.error || t.builder.errors.fixtures);
          }

          return (data.fixtures || []) as Fixture[];
        })
      );

      const unique = Array.from(
        new Map(
          responses
            .flat()
            .map((fixture) => [fixture.fixture.id, fixture] as const)
        ).values()
      );

      return unique;
    }

    async function loadFixtures() {
      setLoadingMatches(true);
      setMatchError("");
      setFixtures([]);
      setForms({});
      setStandings({});
      setH2hMap({});

      try {
        let items: Fixture[] = [];
        const todayKey = getStockholmDateKey();

        if (specificLeagueId) {
          let dateQuery = "";

          if (viewMode === "today") {
            dateQuery = `&date=${todayKey}`;
          } else if (viewMode === "tomorrow") {
            dateQuery = `&date=${addDaysToDateKey(todayKey, 1)}`;
          }

          const response = await fetch(
            `/api/football/fixtures?league=${specificLeagueId}&season=${selectedSeason}${dateQuery}`,
            { signal: controller.signal }
          );

          const data = await response.json();

          if (!response.ok || data.success === false) {
            throw new Error(data.error || t.builder.errors.fixtures);
          }

          items = data.fixtures || [];

          void loadExtraMatchData(
            items.slice(0, fixturePreviewLimit),
            specificLeagueId,
            selectedSeason
          );
        } else if (viewMode === "week") {
          const dates = Array.from({ length: 7 }, (_, index) =>
            addDaysToDateKey(todayKey, index)
          );
          items = await loadByDates(dates);
        } else if (viewMode === "today") {
          items = await loadByDates([todayKey]);
        } else if (viewMode === "tomorrow") {
          items = await loadByDates([addDaysToDateKey(todayKey, 1)]);
        }

        setFixtures(items);
      } catch (error: any) {
        const message =
          error?.name === "AbortError"
            ? t.builder.errors.fixturesTimeout
            : error?.message || t.builder.errors.fixtures;

        console.error("Builder fixture error:", error);
        setMatchError(message);
        setFixtures([]);
      } finally {
        setLoadingMatches(false);
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
    specificLeagueId,
    selectedSeason,
    fixturePreviewLimit,
    loadExtraMatchData,
    t.builder.errors.fixtures,
    t.builder.errors.fixturesTimeout,
  ]);

  useEffect(() => {
    if (!selectedFixture) {
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
  }, [selectedFixtureId, selectedFixture]);

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

  const allowedLeagueIds = useMemo(() => {
    if (specificLeagueId) {
      return new Set([specificLeagueId]);
    }

    if (country === ALL_COUNTRIES_VALUE) {
      return null;
    }

    if (
      country === TOURNAMENTS_VALUE ||
      country === t.builder.tournaments
    ) {
      return new Set(tournamentIds);
    }

    return new Set(leagues.map((league) => league.id));
  }, [specificLeagueId, country, leagues, t.builder.tournaments]);

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

      if (allowedLeagueIds && !allowedLeagueIds.has(fixture.league.id)) {
        return false;
      }

      if (viewMode === "live") {
        return matchesSearch;
      }

      const fixtureDateKey = getFixtureStockholmDateKey(fixture.fixture.date);

      if (viewMode === "today") {
        return matchesSearch && fixtureDateKey === todayKey;
      }

      if (viewMode === "tomorrow") {
        return matchesSearch && fixtureDateKey === tomorrowKey;
      }

      if (viewMode === "week") {
        return (
          matchesSearch &&
          fixtureDateKey >= todayKey &&
          fixtureDateKey < weekEndKey
        );
      }

      return matchesSearch;
    });
  }, [fixtures, liveFixtures, search, viewMode, allowedLeagueIds]);

  function selectFixture(fixture: Fixture) {
    setSelectedFixtureId(fixture.fixture.id);
    setSelectedMarkets([]);
    setPlayerPickDrafts([]);
    setBuilderError("");

    window.requestAnimationFrame(() => {
      builderPanelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  function removeMarketFromSlip(marketName: string) {
    if (!selectedFixture) {
      return;
    }

    const marketText = buildMarketTextFor(marketName, selectedFixture);

    setSlip((current) =>
      current.filter(
        (item) =>
          !(
            item.fixtureId === selectedFixture.fixture.id &&
            item.market === marketText
          )
      )
    );
  }

  function toggleMarketSelection(marketName: string) {
    if (isPlayerMarket(marketName)) {
      selectPlayerMarket(marketName);
      return;
    }

    setBuilderError("");

    if (isMarketInSlip(marketName)) {
      removeMarketFromSlip(marketName);
      setSelectedMarkets((current) =>
        current.filter((item) => item !== marketName)
      );
      return;
    }

    setSelectedMarkets((current) => {
      if (current.includes(marketName)) {
        return current.filter((item) => item !== marketName);
      }

      return [...current, marketName];
    });
    setMarket(marketName);
  }

  function selectPlayerMarket(marketName: string) {
    setBuilderError("");
    setMarket(marketName);
  }

  function addPlayerPickDraft() {
    if (!selectedFixture || !isPlayerMarket(market) || !playerId) {
      setBuilderError(t.builder.playerRequiredForMarkets);
      return;
    }

    const duplicate = playerPickDrafts.some(
      (draft) =>
        draft.market === market &&
        draft.playerId === playerId &&
        draft.playerLine === playerLine
    );

    if (duplicate) {
      setBuilderError(t.builder.duplicatePlayerPick);
      return;
    }

    setBuilderError("");
    setPlayerPickDrafts((current) => [
      ...current,
      {
        id: `${playerId}-${market}-${playerLine}-${Date.now()}`,
        market,
        playerTeam,
        playerId,
        playerName,
        playerLine,
      },
    ]);
  }

  function removePlayerPickDraft(id: string) {
    setPlayerPickDrafts((current) =>
      current.filter((draft) => draft.id !== id)
    );
  }

  function playerDraftCountForMarket(marketName: string) {
    return playerPickDrafts.filter((draft) => draft.market === marketName)
      .length;
  }

  function createSlipItemFromDraft(
    fixture: Fixture,
    draft: PlayerPickDraft
  ): SlipItem {
    const marketText = buildMarketTextFor(draft.market, fixture, {
      playerTeam: draft.playerTeam,
      playerName: draft.playerName,
      playerLine: draft.playerLine,
    });

    return {
      fixtureId: fixture.fixture.id,
      leagueId: fixture.league.id,
      season: fixture.league.season,
      date: fixture.fixture.date,
      homeTeamId: fixture.teams.home.id,
      awayTeamId: fixture.teams.away.id,
      homeTeam: fixture.teams.home.name,
      awayTeam: fixture.teams.away.name,
      market: marketText,
      playerId: draft.playerId,
      playerName: draft.playerName,
    };
  }

  function createSlipItem(fixture: Fixture, marketName: string): SlipItem {
    const marketText = buildMarketTextFor(marketName, fixture);
    const playerProp = isPlayerMarket(marketName);

    return {
      fixtureId: fixture.fixture.id,
      leagueId: fixture.league.id,
      season: fixture.league.season,
      date: fixture.fixture.date,
      homeTeamId: fixture.teams.home.id,
      awayTeamId: fixture.teams.away.id,
      homeTeam: fixture.teams.home.name,
      awayTeam: fixture.teams.away.name,
      market: marketText,
      playerId: playerProp ? playerId : null,
      playerName: playerProp ? playerName : undefined,
    };
  }

  function isFixtureSelectedInSlip(fixture: Fixture) {
    return slip.some((item) => item.fixtureId === fixture.fixture.id);
  }

  function getMarketDisplayLabel(marketName: string) {
    if (
      isCornerOverUnderMarketLabel(marketName) ||
      isCardOverUnderMarketLabel(marketName)
    ) {
      if (
        selectedMarkets.includes(marketName) ||
        isMarketInSlip(marketName) ||
        market === marketName
      ) {
        return buildMarketTextFor(marketName);
      }
    }

    return marketName;
  }

  function buildMarketTextFor(
    marketName: string,
    fixture?: Fixture,
    options?: {
      playerTeam?: "home" | "away";
      playerName?: string;
      playerLine?: string;
      cornerLine?: string;
      cardLine?: string;
    }
  ) {
    const targetFixture = fixture || selectedFixture;
    const playerProp = isPlayerMarket(marketName);

    if (playerProp && targetFixture) {
      const teamSide = options?.playerTeam ?? playerTeam;
      const name = options?.playerName ?? playerName;
      const line = options?.playerLine ?? playerLine;

      return `${marketName}: ${
        teamSide === "home"
          ? targetFixture.teams.home.name
          : targetFixture.teams.away.name
      } · ${name || t.builder.unknownPlayer} · ${line}`;
    }

    if (isCornerOverUnderMarketLabel(marketName)) {
      return formatMarketWithLine(
        marketName,
        options?.cornerLine ?? cornerLine
      );
    }

    if (isCardOverUnderMarketLabel(marketName)) {
      return formatMarketWithLine(
        marketName,
        options?.cardLine ?? cardLine
      );
    }

    return marketName;
  }

  function buildMarketText(fixture?: Fixture) {
    return buildMarketTextFor(market, fixture);
  }

  function isMarketInSlip(marketName: string) {
    if (!selectedFixture || isPlayerMarket(marketName)) {
      return false;
    }

    const marketText = buildMarketTextFor(marketName, selectedFixture);

    return slip.some(
      (item) =>
        item.fixtureId === selectedFixture.fixture.id &&
        item.market === marketText
    );
  }

  function isPlayerDraftInSlip(draft: PlayerPickDraft) {
    if (!selectedFixture) {
      return false;
    }

    const marketText = buildMarketTextFor(draft.market, selectedFixture, {
      playerTeam: draft.playerTeam,
      playerName: draft.playerName,
      playerLine: draft.playerLine,
    });

    return slip.some(
      (item) =>
        item.fixtureId === selectedFixture.fixture.id &&
        item.market === marketText &&
        item.playerId === draft.playerId
    );
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

    const item = createSlipItem(fixture, market);

    setSlip((current) => {
      const exists = current.some(
        (existing) =>
          existing.fixtureId === item.fixtureId &&
          existing.market === item.market
      );

      return exists ? current : [...current, item];
    });
  }

  function addSelectedMarketsToSlip() {
    if (!selectedFixture || totalPendingPicks === 0) {
      setBuilderError(t.builder.selectMarketsFirst);
      return;
    }

    setBuilderError("");

    const items = [
      ...selectedMarkets.map((marketName) =>
        createSlipItem(selectedFixture, marketName)
      ),
      ...playerPickDrafts.map((draft) =>
        createSlipItemFromDraft(selectedFixture, draft)
      ),
    ];

    setSlip((current) => {
      const merged = [...current];

      for (const item of items) {
        const exists = merged.some(
          (existing) =>
            existing.fixtureId === item.fixtureId &&
            existing.market === item.market &&
            (item.playerId ? existing.playerId === item.playerId : true)
        );

        if (!exists) {
          merged.push(item);
        }
      }

      return merged;
    });

    setSelectedMarkets([]);
    setPlayerPickDrafts([]);
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

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-start xl:gap-8">
            <section className="brain-card relative z-20 min-w-0 overflow-visible rounded-3xl p-4 sm:p-8">
              <BuilderViewTabs
                value={viewMode}
                onChange={setViewMode}
                liveCount={liveFixtures.length}
                todayCount={
                  viewMode === "today" ? filteredFixtures.length : undefined
                }
              />

              {loadingOptions ? (
                <div className="mt-5 rounded-3xl border border-[#18ff6d22] bg-black/30 p-6 text-center">
                  <p className="text-[#18ff6d]">
                    {t.builder.loadingOptionsLong}
                  </p>
                </div>
              ) : (
                <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-5">
                  <BuilderPicker
                    label={t.builder.labels.country}
                    icon="🌍"
                    value={country}
                    onChange={setCountry}
                    options={[
                      {
                        label: t.builder.allCountries,
                        value: ALL_COUNTRIES_VALUE,
                        icon: "🌍",
                        description: t.builder.allCountriesDescription,
                      },
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
                    value={leagueId}
                    onChange={(value) => {
                      if (value === ALL_LEAGUES_VALUE) {
                        setLeagueId(ALL_LEAGUES_VALUE);
                        return;
                      }

                      setLeagueId(Number(value));
                    }}
                    options={[
                      {
                        label: t.builder.allLeagues,
                        value: ALL_LEAGUES_VALUE,
                        icon: "🏆",
                        description: t.builder.allLeaguesDescription,
                      },
                      ...leagues.map((league) => ({
                        label: league.name,
                        value: league.id,
                        image: league.logo || undefined,
                        icon: "🏆",
                        description: league.currentSeason
                          ? formatTranslation(t.builder.seasonLabel, {
                              season: league.currentSeason,
                            })
                          : league.type,
                      })),
                    ]}
                  />
                </div>
              )}

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
                      : viewMode === "week"
                        ? t.builder.loadingFixtures
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
              ) : filteredFixtures.length === 0 ? (
                <p className="mt-5 rounded-3xl border border-white/10 bg-black/30 p-6 text-[#A9A9A9]">
                  {viewMode === "today"
                    ? t.builder.noTodayMatches
                    : viewMode === "tomorrow"
                      ? t.builder.noTomorrowMatches
                      : t.builder.noFilteredMatches}
                </p>
              ) : (
                <div
                  className={`mt-5 overflow-y-auto overscroll-contain pr-1 transition-all ${
                    selectedFixture
                      ? "max-h-[28vh] sm:max-h-[32vh]"
                      : "max-h-[52vh] sm:max-h-[60vh] md:max-h-[65vh]"
                  }`}
                >
                  <BuilderLeagueGroups
                    fixtures={filteredFixtures}
                    selectedFixtureId={selectedFixtureId}
                    isInSlip={isFixtureSelectedInSlip}
                    onSelectFixture={selectFixture}
                  />
                </div>
              )}

              {selectedFixture ? (
                <section
                  ref={builderPanelRef}
                  className="mt-6 rounded-3xl border border-[#18ff6d33] bg-[#18ff6d]/5 p-4 sm:p-6"
                >
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

                  <div className="mt-5 max-h-[50vh] overflow-y-auto overscroll-contain pr-1 sm:max-h-[55vh]">
                    <BuilderMarketGrid
                      markets={markets}
                      selectedMarkets={selectedMarkets}
                      onToggleMarket={toggleMarketSelection}
                      activePlayerMarket={isPlayerProp ? market : null}
                      onSelectPlayerMarket={selectPlayerMarket}
                      playerDraftCountForMarket={playerDraftCountForMarket}
                      isMarketInSlip={isMarketInSlip}
                      getMarketDisplayLabel={getMarketDisplayLabel}
                    />
                  </div>

                  {totalPendingPicks > 0 ? (
                    <p className="mt-4 text-sm font-semibold text-[#18ff6d]">
                      {formatTranslation(t.builder.totalSelectionCount, {
                        count: totalPendingPicks,
                      })}
                    </p>
                  ) : null}

                  {builderError ? (
                    <p className="mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                      {builderError}
                    </p>
                  ) : null}
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

  <Button
    onClick={addPlayerPickDraft}
    disabled={!playerId}
    className="mt-4 w-full sm:w-auto"
  >
    {t.builder.addPlayerToSelection}
  </Button>
  </>
        )}

{selectedFixture && hasPlayerPickDrafts ? (
  <section className="mt-5 rounded-2xl border border-[#18ff6d33] bg-black/30 p-4">
    <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#777]">
      {t.builder.playerPicksTitle}
    </p>

    <ul className="mt-3 space-y-2">
      {playerPickDrafts.map((draft) => {
        const inSlip = isPlayerDraftInSlip(draft);

        return (
          <li
            key={draft.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-black/40 px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {draft.playerName}
              </p>
              <p className="truncate text-xs text-[#A9A9A9]">
                {draft.market} · {draft.playerLine}
                {inSlip ? ` · ${t.fixtureCard.inSlipBadge}` : ""}
              </p>
            </div>

            <button
              type="button"
              onClick={() => removePlayerPickDraft(draft.id)}
              className="shrink-0 rounded-lg border border-white/10 px-2.5 py-1 text-xs font-semibold text-[#A9A9A9] hover:border-red-500/40 hover:text-red-200"
              title={t.builder.removeTitle}
            >
              ✕
            </button>
          </li>
        );
      })}
    </ul>
  </section>
) : null}

{selectedFixture &&
  (hasSelectedCornerLineMarkets || isActiveCornerLineMarket) && (
  <div className="mt-6">
    <BuilderPicker
      label={t.builder.cornerLineLabel}
      icon="🚩"
      value={cornerLine}
      onChange={setCornerLine}
      searchable={false}
      options={CORNER_LINE_OPTIONS.map((line) => ({
        label: line,
        value: line,
        icon: "🚩",
        description: formatTranslation(t.builder.cornerLineDescription, {
          line,
        }),
      }))}
    />
  </div>
)}

{selectedFixture &&
  (hasSelectedCardLineMarkets || isActiveCardLineMarket) && (
  <div className="mt-6">
    <BuilderPicker
      label={t.builder.cardLineLabel}
      icon="🟨"
      value={cardLine}
      onChange={setCardLine}
      searchable={false}
      options={CARD_LINE_OPTIONS.map((line) => ({
        label: line,
        value: line,
        icon: "🟨",
        description: formatTranslation(t.builder.cardLineDescription, {
          line,
        }),
      }))}
    />
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
                onClick={addSelectedMarketsToSlip}
                disabled={!selectedFixture || totalPendingPicks === 0}
                className="mt-6 w-full"
              >
                {totalPendingPicks === 1
                  ? t.builder.addOneMarket
                  : formatTranslation(t.builder.addSelectedMarkets, {
                      count: totalPendingPicks,
                    })}
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

            <aside className="brain-card relative z-10 hidden h-fit rounded-3xl p-4 sm:p-8 xl:sticky xl:top-24 xl:block">
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