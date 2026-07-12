import { NextResponse } from "next/server";
import { fetchFootballApi, jsonWithCache } from "@/lib/footballApiFetch";

const supportedCountries = new Set([
  "England",
  "Scotland",
  "Wales",
  "Ireland",
  "Northern-Ireland",

  "Spain",
  "Italy",
  "Germany",
  "France",
  "Netherlands",
  "Portugal",
  "Belgium",
  "Turkey",
  "Greece",
  "Austria",
  "Switzerland",

  "Sweden",
  "Norway",
  "Denmark",
  "Finland",
  "Iceland",

  "Poland",
  "Czech-Republic",
  "Croatia",
  "Serbia",
  "Romania",
  "Bulgaria",
  "Ukraine",

  "Brazil",
  "Argentina",
  "Uruguay",
  "Colombia",
  "Chile",
  "Mexico",

  "USA",
  "Canada",

  "Japan",
  "China",
  "South-Korea",
  "Australia",

  "Saudi-Arabia",
  "United-Arab-Emirates",
  "Qatar",

  "South-Africa",
  "Egypt",
  "Morocco",
]);

const tournamentIds = new Set([
  1,   // World Cup
  2,   // Champions League
  3,   // Europa League
  4,   // Euro Championship
  5,   // Nations League
  9,   // Copa America
  848, // Conference League
]);

const excludedWords =
  /\b(women|woman|women's|feminine|female|youth|u17|u18|u19|u20|u21|u23|reserve|reserves|academy|amateur)\b/i;

export async function GET() {
  try {
    const apiKey = process.env.API_FOOTBALL_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "API_FOOTBALL_KEY saknas.",
          leagues: [],
        },
        { status: 500 }
      );
    }

    const response = await fetchFootballApi("leagues", 86400);

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Football API svarade med ${response.status}.`,
          leagues: [],
          apiErrors: data?.errors || null,
        },
        { status: response.status }
      );
    }

    const leagues = (data.response || [])
      .filter((item: any) => {
        const leagueId = Number(item.league?.id);
        const country = item.country?.name || "";
        const leagueName = item.league?.name || "";

        const isTournament = tournamentIds.has(leagueId);
        const isSupportedCountry =
          supportedCountries.has(country);

        const hasSeason =
          Array.isArray(item.seasons) &&
          item.seasons.length > 0;

        const isExcluded =
          excludedWords.test(leagueName);

        return (
          (isTournament || isSupportedCountry) &&
          hasSeason &&
          !isExcluded
        );
      })
      .map((item: any) => {
        const currentSeason =
          item.seasons?.find(
            (season: any) => season.current === true
          )?.year ??
          item.seasons?.[item.seasons.length - 1]?.year ??
          new Date().getFullYear();

        const currentSeasonData =
          item.seasons?.find(
            (season: any) =>
              season.year === currentSeason
          ) || null;

        return {
          id: Number(item.league.id),
          name: item.league.name,
          type: item.league.type,
          country: item.country.name,
          countryCode: item.country.code,
          flag: item.country.flag,
          logo: item.league.logo,
          currentSeason,
          coverage:
            currentSeasonData?.coverage || null,
        };
      })
      .filter(
        (
          league: any,
          index: number,
          array: any[]
        ) =>
          array.findIndex(
            (item) => item.id === league.id
          ) === index
      )
      .sort((a: any, b: any) => {
        const aTournament = tournamentIds.has(a.id);
        const bTournament = tournamentIds.has(b.id);

        if (aTournament && !bTournament) return -1;
        if (!aTournament && bTournament) return 1;

        if (a.country !== b.country) {
          return a.country.localeCompare(
            b.country,
            "sv"
          );
        }

        return a.name.localeCompare(b.name, "sv");
      });

    return jsonWithCache(
      {
        success: true,
        leagues,
        count: leagues.length,
        apiErrors: data?.errors || null,
      },
      86400
    );
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : String(error),
        leagues: [],
      },
      { status: 500 }
    );
  }
}