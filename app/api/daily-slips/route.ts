import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type UserPlan = "free" | "pro" | "elite";

type GeneratedPick = {
  match: string;
  market: string;
  probability: number;
};

type GeneratedSlip = {
  title: string;
  risk: string;
  confidence: number;
  picks: GeneratedPick[];
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

function getSlipLimit(plan: UserPlan) {
  if (plan === "elite") return 5;
  if (plan === "pro") return 3;

  return 1;
}

function formatStockholmDate(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Stockholm",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function calculateFairOdds(probability: number) {
  const safeProbability = Math.min(
    95,
    Math.max(10, probability)
  );

  return Number((100 / safeProbability).toFixed(2));
}

function normalizeRisk(value: unknown) {
  if (
    value === "Lägre risk" ||
    value === "Balanserad" ||
    value === "Value" ||
    value === "Högre risk" ||
    value === "Special"
  ) {
    return value;
  }

  return "Balanserad";
}

async function fetchUpcomingFixtures() {
    const apiKey = process.env.API_FOOTBALL_KEY;
  
    if (!apiKey) {
      throw new Error("API_FOOTBALL_KEY saknas i .env.local.");
    }
  
    const dates = Array.from({ length: 14 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() + index);
  
      return new Intl.DateTimeFormat("sv-SE", {
        timeZone: "Europe/Stockholm",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(date);
    });
  
    const responses = await Promise.all(
      dates.map(async (date) => {
        const response = await fetch(
          `https://v3.football.api-sports.io/fixtures?date=${date}`,
          {
            headers: {
              "x-apisports-key": apiKey,
            },
            cache: "no-store",
          }
        );
  
        const data = await response.json();
  
        if (!response.ok) {
          console.error(
            `API-Football misslyckades för ${date}:`,
            response.status,
            data
          );
  
          return [];
        }
  
        if (
          data?.errors &&
          typeof data.errors === "object" &&
          Object.keys(data.errors).length > 0
        ) {
          console.error(
            `API-Football-fel för ${date}:`,
            data.errors
          );
  
          return [];
        }
  
        return Array.isArray(data?.response)
          ? data.response
          : [];
      })
    );
  
    const fixtures = responses
      .flat()
      .filter((fixture: any) => {
        const status = fixture.fixture?.status?.short;
  
        return status === "NS" || status === "TBD";
      })
      .filter(
        (fixture: any) =>
          fixture.fixture?.id &&
          fixture.teams?.home?.name &&
          fixture.teams?.away?.name
      );
  
    const uniqueFixtures = Array.from(
      new Map(
        fixtures.map((fixture: any) => [
          fixture.fixture.id,
          fixture,
        ])
      ).values()
    );
  
    console.log(
      `Daily slips: ${uniqueFixtures.length} kommande matcher hittades.`
    );
  
    return uniqueFixtures
      .slice(0, 100)
      .map((fixture: any) => ({
        fixtureId: fixture.fixture.id,
        date: fixture.fixture.date,
        league: fixture.league?.name || "Okänd liga",
        country: fixture.league?.country || "Okänt land",
        homeTeam: fixture.teams.home.name,
        awayTeam: fixture.teams.away.name,
      }));
  }
  
function cleanOpenAIJson(content: string) {
  return content
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function parseGeneratedSlips(
  content: string,
  limit: number
): GeneratedSlip[] {
  const cleaned = cleanOpenAIJson(content);
  const parsed = JSON.parse(cleaned);

  const rawSlips = Array.isArray(parsed?.slips)
    ? parsed.slips
    : [];

  return rawSlips
    .slice(0, limit)
    .map(
      (
        slip: any,
        slipIndex: number
      ): GeneratedSlip => ({
        title:
          typeof slip?.title === "string"
            ? slip.title
            : `AI-kupong ${slipIndex + 1}`,

        risk: normalizeRisk(slip?.risk),

        confidence: Math.min(
          95,
          Math.max(
            20,
            Number(slip?.confidence || 60)
          )
        ),

        picks: Array.isArray(slip?.picks)
          ? slip.picks
              .slice(0, 3)
              .map((pick: any) => ({
                match:
                  typeof pick?.match === "string"
                    ? pick.match
                    : "Okänd match",

                market:
                  typeof pick?.market === "string"
                    ? pick.market
                    : "Okänd marknad",

                probability: Math.min(
                  95,
                  Math.max(
                    10,
                    Number(
                      pick?.probability || 55
                    )
                  )
                ),
              }))
          : [],
      })
    )
    .filter((slip: GeneratedSlip) => {
      return slip.picks.length >= 2;
    });
}

export async function GET(request: Request) {
  try {
    const authHeader =
      request.headers.get("authorization");

    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Du måste vara inloggad.",
        },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Inloggningen kunde inte verifieras.",
        },
        { status: 401 }
      );
    }

    const {
      data: profile,
      error: profileError,
    } = await supabaseAdmin
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    const plan: UserPlan =
      profile?.plan === "pro" ||
      profile?.plan === "elite"
        ? profile.plan
        : "free";

    const slipLimit = getSlipLimit(plan);
    const today = formatStockholmDate(new Date());

    /*
     * Kontrollera om dagens kuponger redan finns
     * för den här användaren.
     */
    const {
      data: existing,
      error: existingError,
    } = await supabaseAdmin
      .from("daily_slips")
      .select(
        "id, valid_date, slip_index, title, risk, confidence, picks"
      )
      .eq("user_id", user.id)
      .eq("valid_date", today)
      .order("slip_index", {
        ascending: true,
      });

    if (existingError) {
      throw existingError;
    }

    if ((existing || []).length >= slipLimit) {
      return NextResponse.json({
        success: true,
        plan,
        slipLimit,
        fixturesFound: null,
        generatedToday: false,
        slips:
          existing?.slice(0, slipLimit) || [],
      });
    }

    const fixtures =
      await fetchUpcomingFixtures();

    console.log(
      `Daily slips: ${fixtures.length} kommande matcher hittades.`
    );

    if (fixtures.length < 3) {
      return NextResponse.json(
        {
          success: false,
          fixturesFound: fixtures.length,
          error:
            "Det finns inte tillräckligt många kommande matcher för att skapa dagens kuponger.",
        },
        { status: 404 }
      );
    }

    const completion =
      await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        temperature: 0.3,
        response_format: {
          type: "json_object",
        },
        messages: [
          {
            role: "system",
            content:
              "Du skapar neutrala, datadrivna fotbollskuponger. Du får aldrig kalla ett spel säkert, garanterat eller riskfritt. Använd endast matcher som finns i listan. Svara endast med giltig JSON.",
          },
          {
            role: "user",
            content: `
Skapa exakt ${slipLimit} separata AI-kuponger.

Användarens plan är:
${plan}

Kupongprofiler i denna ordning:

1. Lägre risk
2. Balanserad
3. Value
4. Högre risk
5. Special

Regler:

- Varje kupong ska innehålla exakt 3 val.
- Varje val ska komma från en match i listan.
- Använd inte samma match mer än en gång i samma kupong.
- Använd inte exakt samma kombination i flera kuponger.
- Probability ska vara ett heltal mellan 10 och 95.
- Inget spel får beskrivas som säkert eller garanterat.

Varje val måste innehålla:

- match
- market
- probability

Använd bara dessa marknader:

- Hemmalag vinner
- Bortalag vinner
- Dubbelchans
- Draw No Bet
- Över 1.5 mål
- Över 2.5 mål
- Under 3.5 mål
- Båda lagen gör mål

Använd endast dessa kommande matcher:

${JSON.stringify(fixtures, null, 2)}

Svara exakt enligt denna JSON-struktur:

{
  "slips": [
    {
      "title": "Lägre risk",
      "risk": "Lägre risk",
      "confidence": 78,
      "picks": [
        {
          "match": "Lag A - Lag B",
          "market": "Dubbelchans Lag A eller oavgjort",
          "probability": 72
        },
        {
          "match": "Lag C - Lag D",
          "market": "Över 1.5 mål",
          "probability": 70
        },
        {
          "match": "Lag E - Lag F",
          "market": "Under 3.5 mål",
          "probability": 68
        }
      ]
    }
  ]
}
`,
          },
        ],
      });

    const content =
      completion.choices[0]?.message
        ?.content || "{}";

    const generatedSlips =
      parseGeneratedSlips(
        content,
        slipLimit
      );

    if (
      generatedSlips.length < slipLimit
    ) {
      throw new Error(
        `AI skapade endast ${generatedSlips.length} av ${slipLimit} kuponger. Försök igen.`
      );
    }

    const rows = generatedSlips.map(
      (slip, index) => ({
        user_id: user.id,
        valid_date: today,
        slip_index: index + 1,
        title: slip.title,
        risk: slip.risk,
        confidence: slip.confidence,

        picks: slip.picks.map((pick) => ({
          match: pick.match,
          market: pick.market,
          probability: pick.probability,
          estimatedOdds:
            calculateFairOdds(
              pick.probability
            ),
        })),
      })
    );

    const {
      data: inserted,
      error: insertError,
    } = await supabaseAdmin
      .from("daily_slips")
      .upsert(rows, {
        onConflict:
          "user_id,valid_date,slip_index",
      })
      .select(
        "id, valid_date, slip_index, title, risk, confidence, picks"
      )
      .order("slip_index", {
        ascending: true,
      });

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      plan,
      slipLimit,
      fixturesFound: fixtures.length,
      generatedToday: true,
      slips: inserted || [],
    });
  } catch (error: unknown) {
    console.error(
      "DAILY SLIPS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Dagens kuponger kunde inte skapas.",
      },
      { status: 500 }
    );
  }
}