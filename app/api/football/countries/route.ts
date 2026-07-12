import { NextResponse } from "next/server";

const supportedCountries = [
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
];

export async function GET() {
  try {
    const apiKey = process.env.API_FOOTBALL_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "API_FOOTBALL_KEY saknas.",
          countries: [],
        },
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://v3.football.api-sports.io/countries",
      {
        headers: {
          "x-apisports-key": apiKey,
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Football API svarade med ${response.status}.`,
          countries: [],
          apiErrors: data?.errors || null,
        },
        { status: response.status }
      );
    }

    const countries = (data.response || [])
      .filter((country: any) =>
        supportedCountries.includes(country.name)
      )
      .sort((a: any, b: any) =>
        a.name.localeCompare(b.name, "sv")
      );

    return NextResponse.json({
      success: true,
      countries,
      count: countries.length,
      apiErrors: data?.errors || null,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : String(error),
        countries: [],
      },
      { status: 500 }
    );
  }
}