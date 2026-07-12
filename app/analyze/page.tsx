"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Button from "@/components/Button";
import FootballBackground from "@/components/FootballBackground";
import BrainCard from "@/components/BrainCard";


type ScoreBreakdown = {
  form?: number;
  table?: number;
  h2h?: number;
  stats?: number;
  market?: number;
  confidence?: number;
};

type BrainPick = {
  market: string;
  confidence: number;
  reason: string;
};

type LastMatch = {
  fixture: { id: number; date: string };
  teams: {
    home: { id: number; name: string; winner?: boolean | null };
    away: { id: number; name: string; winner?: boolean | null };
  };
  goals: { home: number | null; away: number | null };
};

type Injury = {
  player?: {
    id?: number;
    name?: string;
    photo?: string;
    type?: string;
    reason?: string;
  };
  team?: { id?: number; name?: string; logo?: string };
  type?: string;
  reason?: string;
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

type AIResult = {
  summary: string;
  strengths: string[];
  risks: string[];
  recommendation: string;
  brainScore?: number;
  riskLevel?: string;
  confidence?: number;
  scoreBreakdown?: ScoreBreakdown;
  brainPick?: BrainPick | null;
};

type Weather = {
  temperature?: string | number;
  description?: string;
  wind?: string | number;
  humidity?: string | number;
};

type UsedData = {
  lastMatches?: {
    home?: LastMatch[];
    away?: LastMatch[];
  };
  injuries?: Injury[];
  lineups?: TeamLineup[];
  confirmedLineups?: boolean;
  weather?: Weather | null;
  referee?: string | null;
};

const cardClass =
  "brain-card rounded-3xl p-8 transition-all duration-300 hover:-translate-y-1";

const titleGradient =
  "bg-gradient-to-r from-[#18ff6d] via-[#E8DCC8] to-[#2fbfff] bg-clip-text text-transparent";

function resultIcon(match: LastMatch) {
  if (match.goals.home === match.goals.away) return "🟡";
  if (match.teams.home.winner || match.teams.away.winner) return "🟢";
  return "🔴";
}

function matchText(match: LastMatch) {
  return `${match.teams.home.name} ${match.goals.home ?? "-"}-${
    match.goals.away ?? "-"
  } ${match.teams.away.name}`;
}

function injuryReason(injury: Injury) {
  return (
    injury.reason ||
    injury.player?.reason ||
    injury.player?.type ||
    injury.type ||
    "Ingen orsak angiven"
  );
}

function AnalyzePageContent() {
  const searchParams = useSearchParams();

  const [betText, setBetText] = useState("");
  const [showReport, setShowReport] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [usedData, setUsedData] = useState<UsedData | null>(null);
  const [premiumError, setPremiumError] = useState("");

  useEffect(() => {
    const text = searchParams.get("text");
    if (text) setBetText(text);
  }, [searchParams]);

  async function handleAnalyze() {
    setLoading(true);
    setShowReport(false);
    setAiResult(null);
    setUsedData(null);
    setPremiumError("");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {}),
      },
      body: JSON.stringify({ text: betText }),
    });

    const data = await response.json();

if (data.premiumRequired) {
  setLoading(false);
  setPremiumError(data.error);
  return;
}

setAiResult(data.analysis);
setUsedData(data.usedData || null);
setLoading(false);
setShowReport(true);}

  const score = aiResult?.brainScore ?? 0;
  const confidence = aiResult?.confidence ?? 0;
  const risk = aiResult?.riskLevel ?? "Unknown";
  const breakdown = aiResult?.scoreBreakdown || {};
  const homeLastMatches = usedData?.lastMatches?.home || [];
  const awayLastMatches = usedData?.lastMatches?.away || [];
  const injuries = usedData?.injuries || [];
const lineups = usedData?.lineups || [];
const homeLineup = lineups[0];
const awayLineup = lineups[1];
const confirmedLineups =
  usedData?.confirmedLineups === true && lineups.length >= 2;

const weather = usedData?.weather;
const referee = usedData?.referee;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-[#FAFAF8]">
      <FootballBackground />

      <div className="relative z-10">
        <Navbar />

        <div className="mx-auto max-w-6xl px-8 py-10">
        <section className="mt-14 overflow-hidden rounded-[2rem] border border-[#18ff6d22] bg-black/35 p-10 backdrop-blur-xl shadow-[0_0_80px_rgba(24,255,109,.12)]">
  <div className="inline-flex rounded-full border border-[#18ff6d33] bg-[#18ff6d]/10 px-4 py-2 text-sm font-semibold text-[#18ff6d]">
    ⚽ Live Football Intelligence
  </div>

  <p className={`mt-8 text-sm uppercase tracking-[0.45em] ${titleGradient}`}>
    Brain Engine™
  </p>

  <h2 className="mt-4 max-w-5xl text-6xl font-black leading-tight">
    Analysera din spelidé med AI.
  </h2>

  <p className="mt-6 max-w-2xl text-lg leading-8 text-[#A9A9A9]">
    BrainStats analyserar form, tabell, H2H, skador, väder och matchdata för att ge dig en tydligare bild innan du tar beslut.
  </p>

  <div className="mt-8 grid gap-4 md:grid-cols-3">
    <div className="rounded-2xl border border-[#18ff6d22] bg-black/35 p-5">
      <p className="text-sm text-[#A9A9A9]">AI Engine</p>
      <p className="mt-2 text-2xl font-bold text-[#18ff6d]">Online</p>
    </div>

    <div className="rounded-2xl border border-[#18ff6d22] bg-black/35 p-5">
      <p className="text-sm text-[#A9A9A9]">Data Sources</p>
      <p className="mt-2 text-2xl font-bold text-[#18ff6d]">Live</p>
    </div>

    <div className="rounded-2xl border border-[#18ff6d22] bg-black/35 p-5">
      <p className="text-sm text-[#A9A9A9]">Risk Model</p>
      <p className="mt-2 text-2xl font-bold text-[#18ff6d]">Active</p>
    </div>
  </div>
</section>

          <section className="mt-10 rounded-3xl border border-[#18ff6d22] bg-[#121212]/75 p-6 backdrop-blur-xl">
            <textarea
              value={betText}
              onChange={(e) => {
                setBetText(e.target.value);
                setShowReport(false);
              }}
              placeholder="Liverpool - Arsenal&#10;Över 2.5 mål"
              className="min-h-64 w-full resize-none rounded-2xl border border-[#18ff6d22] bg-black/40 p-5 text-white outline-none placeholder:text-[#666]"
            />

            <Button
              onClick={handleAnalyze}
              disabled={!betText.trim() || loading}
              className="mt-5 w-full py-4"
            >
              {loading ? "Analyserar..." : "🧠 Kör Brain Engine"}
            </Button>
          </section>

          {loading && (
            <section className="mt-8 rounded-3xl border border-[#18ff6d22] bg-[#121212]/75 p-6 backdrop-blur-xl">
              <p className={titleGradient}>Brain Engine analyserar data...</p>
            </section>
          )}

{premiumError && (
  <section className="mt-8 rounded-3xl border border-yellow-500/40 bg-yellow-500/10 p-8 text-center">
    <h2 className="text-3xl font-bold text-yellow-300">
      Premium krävs
    </h2>

    <p className="mt-4 text-[#D8D8D8]">
      {premiumError}
    </p>

    <Button
      className="mt-6"
      onClick={() => {
        window.location.href = "/premium";
      }}
    >
      🚀 Uppgradera till Pro
    </Button>
  </section>
)}

          {showReport && aiResult && (
            <section className="mt-8 space-y-8">
              <div className="brain-card overflow-hidden rounded-[2rem] p-10">
  <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
    <div>
      <p className={`text-sm uppercase tracking-[0.45em] ${titleGradient}`}>
        Brain Engine™ Report
      </p>

      <h2 className="mt-4 text-5xl font-black">
        AI Match Analysis
      </h2>

      <p className="mt-4 max-w-2xl leading-8 text-[#A9A9A9]">
        {aiResult.summary}
      </p>
    </div>

    <div className="relative flex h-56 w-56 items-center justify-center rounded-full border border-[#18ff6d33] bg-black/40 shadow-[0_0_80px_rgba(24,255,109,.22)]">
      <div className="absolute inset-4 rounded-full border border-[#18ff6d22]" />
      <div className="absolute inset-8 rounded-full border border-[#2fbfff22]" />

      <div className="text-center">
        <div className="text-7xl font-black text-[#18ff6d] drop-shadow-[0_0_40px_rgba(24,255,109,.75)]">
          {score}
        </div>
        <p className="mt-1 text-sm text-[#A9A9A9]">/100 BrainScore™</p>
      </div>
    </div>
  </div>

  <div className="mt-10 grid gap-5 md:grid-cols-3">
    <div className="rounded-2xl border border-[#18ff6d22] bg-black/35 p-5">
      <p className="text-sm text-[#A9A9A9]">Risknivå</p>
      <p className="mt-2 text-2xl font-bold text-[#18ff6d]">{risk}</p>
    </div>

    <div className="rounded-2xl border border-[#18ff6d22] bg-black/35 p-5">
      <p className="text-sm text-[#A9A9A9]">Confidence</p>
      <p className="mt-2 text-2xl font-bold text-[#18ff6d]">{confidence}%</p>
    </div>

    <div className="rounded-2xl border border-[#18ff6d22] bg-black/35 p-5">
      <p className="text-sm text-[#A9A9A9]">Analysis Mode</p>
      <p className="mt-2 text-2xl font-bold text-[#18ff6d]">Live AI</p>
    </div>
  </div>

  <div className="mt-8">
    <div className="mb-3 flex justify-between text-sm">
      <span className="text-[#A9A9A9]">BrainScore Power</span>
      <span className="font-semibold text-[#18ff6d]">{score}%</span>
    </div>

    <div className="h-5 overflow-hidden rounded-full bg-black/60">
      <div
        className="h-full rounded-full bg-gradient-to-r from-[#18ff6d] via-[#E8DCC8] to-[#2fbfff] transition-all duration-700"
        style={{ width: `${Math.min(score, 100)}%` }}
      />
    </div>
  </div>
</div>

<div className="grid gap-6 md:grid-cols-2">
  <div className={cardClass}>
    <p
      className={`text-sm uppercase tracking-[0.25em] ${titleGradient}`}
    >
      Score Breakdown
    </p>

    <h3 className="mt-2 text-2xl font-bold text-white">
      <span className="mr-2">📊</span>
      Datapoäng
    </h3>

    <div className="mt-6 space-y-5">
      {Object.entries(breakdown).map(([key, value]) => (
        <div key={key}>
          <div className="mb-2 flex justify-between text-sm">
            <span className="capitalize text-[#A9A9A9]">
              {key}
            </span>

            <span className="font-semibold text-[#18ff6d]">
              +{value}
            </span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-black/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#18ff6d] to-[#2fbfff] transition-all duration-700"
              style={{
                width: `${Math.min(Number(value) * 5, 100)}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  </div>

  <div className={cardClass}>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p
          className={`text-sm uppercase tracking-[0.25em] ${titleGradient}`}
        >
          Starting XI
        </p>

        <h3 className="mt-2 text-2xl font-bold text-white">
          <span className="mr-2">👥</span>
          Startelvor
        </h3>
      </div>

      <span
        className={`rounded-full border px-4 py-2 text-xs font-bold ${
          confirmedLineups
            ? "border-[#18ff6d44] bg-[#18ff6d]/10 text-[#18ff6d]"
            : "border-yellow-500/40 bg-yellow-500/10 text-yellow-300"
        }`}
      >
        {confirmedLineups
          ? "✓ Bekräftade"
          : "Inväntar publicering"}
      </span>
    </div>

    {!confirmedLineups ? (
      <div className="mt-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5">
        <p className="font-semibold text-yellow-200">
          Startelvorna är ännu inte publicerade
        </p>

        <p className="mt-2 text-sm leading-6 text-[#A9A9A9]">
          Bekräftade startelvor publiceras vanligtvis nära
          matchstart. Gör analysen igen senare för att hämta den
          senaste informationen.
        </p>
      </div>
    ) : (
      <div className="mt-6 space-y-6">
        {[homeLineup, awayLineup].map((lineup, teamIndex) => (
          <div
            key={lineup?.team?.id || teamIndex}
            className="overflow-hidden rounded-2xl border border-[#18ff6d22] bg-black/35"
          >
            <div className="flex items-center gap-4 border-b border-white/10 p-5">
              {lineup?.team?.logo && (
                <img
                  src={lineup.team.logo}
                  alt={lineup.team.name || "Lag"}
                  className="h-12 w-12 rounded-full bg-white p-1"
                />
              )}

              <div>
                <p className="text-lg font-black text-white">
                  {lineup?.team?.name ||
                    (teamIndex === 0
                      ? "Hemmalag"
                      : "Bortalag")}
                </p>

                <p className="mt-1 text-sm text-[#18ff6d]">
                  Formation:{" "}
                  {lineup?.formation || "Ej angiven"}
                </p>

                {lineup?.coach?.name && (
                  <p className="mt-1 text-xs text-[#A9A9A9]">
                    Tränare: {lineup.coach.name}
                  </p>
                )}
              </div>
            </div>

            <div className="p-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#777]">
                Startande spelare
              </p>

              <div className="mt-4 space-y-2">
                {(lineup?.startXI || []).map(
                  (player, playerIndex) => (
                    <div
                      key={
                        player.id ||
                        `${player.name}-${playerIndex}`
                      }
                      className="flex items-center justify-between rounded-xl border border-white/5 bg-[#101010]/80 px-4 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#18ff6d]/10 text-sm font-black text-[#18ff6d]">
                          {player.number ?? "–"}
                        </span>

                        <span className="truncate font-semibold text-[#E8E8E8]">
                          {player.name || "Okänd spelare"}
                        </span>
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
  </div>
</div>


              <div className="grid gap-6 md:grid-cols-2">
                {weather && (
                  <div className={cardClass}>
                    <p className={`text-sm uppercase tracking-[0.25em] ${titleGradient}`}>
                      Match Conditions
                    </p>
                    <h3 className="mt-2 text-2xl font-bold text-white">
                      <span className="mr-2">🌦️</span>
                      Väder
                    </h3>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      {[
                        ["Temperatur", `${weather.temperature ?? "-"}°C`],
                        ["Väder", weather.description ?? "-"],
                        ["Vind", `${weather.wind ?? "-"} km/h`],
                        ["Luftfuktighet", `${weather.humidity ?? "-"}%`],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="rounded-2xl border border-[#18ff6d11] bg-black/35 p-5"
                        >
                          <p className="text-sm text-[#A9A9A9]">{label}</p>
                          <p className="mt-2 text-2xl font-bold text-[#18ff6d]">
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {referee && (
                  <div className={cardClass}>
                    <p className={`text-sm uppercase tracking-[0.25em] ${titleGradient}`}>
                      Match Official
                    </p>
                    <h3 className="mt-2 text-2xl font-bold text-white">
                      <span className="mr-2">👨‍⚖️</span>
                      Domare
                    </h3>

                    <div className="mt-6 rounded-2xl border border-[#18ff6d11] bg-black/35 p-6">
                      <p className="text-sm text-[#A9A9A9]">Matchdomare</p>
                      <p className="mt-3 text-3xl font-bold text-[#18ff6d]">
                        {referee}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className={cardClass}>
                <p className={`text-sm uppercase tracking-[0.25em] ${titleGradient}`}>
                  Team Form
                </p>
                <h3 className="mt-2 text-2xl font-bold text-white">
                  <span className="mr-2">📈</span>
                  Senaste 5 matcher
                </h3>

                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  {[
                    ["Hemmalag", homeLastMatches],
                    ["Bortalag", awayLastMatches],
                  ].map(([label, matches]) => (
                    <div
                      key={label as string}
                      className="rounded-2xl border border-[#18ff6d11] bg-black/35 p-5"
                    >
                      <h4 className="font-bold text-[#18ff6d]">
                        {label as string}
                      </h4>

                      <div className="mt-4 space-y-3">
                        {(matches as LastMatch[]).length === 0 ? (
                          <p className="text-sm text-[#A9A9A9]">
                            Ingen matchdata tillgänglig.
                          </p>
                        ) : (
                          (matches as LastMatch[]).map((match) => (
                            <div
                              key={match.fixture.id}
                              className="rounded-xl bg-[#101010]/80 p-3 text-sm text-[#D8D8D8] transition hover:bg-[#151515]"
                            >
                              <span className="mr-2">{resultIcon(match)}</span>
                              {matchText(match)}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={cardClass}>
                <h3 className="text-2xl font-bold text-white">
                  <span className="mr-2">🏥</span>
                  Skador & frånvaro
                </h3>

                <div className="mt-6 space-y-3">
                  {injuries.length === 0 ? (
                    <p className="text-sm text-[#A9A9A9]">
                      Inga rapporterade skador för den här matchen.
                    </p>
                  ) : (
                    injuries.map((injury, index) => (
                      <div
                        key={`${injury.player?.name}-${index}`}
                        className="flex items-center gap-4 rounded-2xl bg-black/35 p-4 text-sm"
                      >
                        {injury.team?.logo && (
                          <img
                            src={injury.team.logo}
                            alt={injury.team.name || "Lag"}
                            className="h-9 w-9 rounded-full bg-white p-1"
                          />
                        )}

                        <div>
                          <p className="font-semibold text-[#18ff6d]">
                            {injury.player?.name || "Okänd spelare"}
                          </p>
                          <p className="mt-1 text-[#D8D8D8]">
                            {injury.team?.name || "Okänt lag"}
                          </p>
                          <p className="mt-1 text-[#A9A9A9]">
                            {injuryReason(injury)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className={cardClass}>
                <h3 className="text-2xl font-bold text-white">
                  Din spelidé
                </h3>
                <pre className="mt-5 whitespace-pre-wrap rounded-2xl bg-black/40 p-5 text-sm text-[#D8D8D8]">
                  {betText}
                </pre>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className={cardClass}>
                  <h3 className="text-2xl font-bold text-white">
                    <span className="mr-2">👍</span>
                    Styrkor
                  </h3>
                  <ul className="mt-5 space-y-3 text-[#D8D8D8]">
                    {aiResult.strengths.map((item) => (
                      <li key={item}>✓ {item}</li>
                    ))}
                  </ul>
                </div>

                <div className={cardClass}>
                  <h3 className="text-2xl font-bold text-white">
                    <span className="mr-2">⚠</span>
                    Risker
                  </h3>
                  <ul className="mt-5 space-y-3 text-[#D8D8D8]">
                    {aiResult.risks.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className={cardClass}>
                <h3 className="text-2xl font-bold text-white">
                  <span className="mr-2">💡</span>
                  Rekommendation
                </h3>
                <p className="mt-5 leading-8 text-[#D8D8D8]">
                  {aiResult.recommendation}
                </p>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense
      fallback={
        <main className="relative min-h-screen overflow-hidden bg-[#050505] text-[#FAFAF8]">
          <FootballBackground />
          <div className="relative z-10">
            <Navbar />
            <div className="flex min-h-[60vh] items-center justify-center">
              <p className="text-[#A9A9A9]">Laddar...</p>
            </div>
          </div>
        </main>
      }
    >
      <AnalyzePageContent />
    </Suspense>
  );
}