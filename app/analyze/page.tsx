"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Button from "@/components/Button";
import FootballBackground from "@/components/FootballBackground";
import BrainCard from "@/components/BrainCard";
import { useLanguage } from "@/components/LanguageProvider";
import {
  formatTranslation,
  translateBreakdownKey,
  translateRiskLevel,
} from "@/lib/locale";
import {
  ANALYZE_DRAFT_KEY,
  ANALYZE_INPUT_MODE_KEY,
} from "@/lib/safeRedirect";
import BetSlipImageUpload from "@/components/BetSlipImageUpload";
import AnalyzeQuickStart from "@/components/AnalyzeQuickStart";
import ResponsibleUseNotice from "@/components/ResponsibleUseNotice";
import AnalysisExecutiveSummary from "@/components/AnalysisExecutiveSummary";
import CollapsibleReportSection from "@/components/CollapsibleReportSection";
import type { WorthBetting } from "@/lib/worthBetting";
import { getSampleAnalysis } from "@/lib/sampleAnalysis";
import {
  summarizeRotationRisksForUi,
  type RotationRisk,
  type ScheduleContextStatus,
} from "@/lib/matchImportance";
import {
  hasPartialLineups,
  type PlayerLineupStatus,
} from "@/lib/lineups";


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
  confidence?: number;
  probability?: number;
  estimatedOdds?: number;
  riskLevel?: string;
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
  worthBetting?: WorthBetting;
  brainScore?: number;
  riskLevel?: string;
  confidence?: number;
  scoreBreakdown?: ScoreBreakdown;
  brainPick?: BrainPick | null;
  brainPicks?: BrainPick[];
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
  rotationRisks?: RotationRisk[];
  scheduleContext?: ScheduleContextStatus;
  scheduleTeamsChecked?: string[];
  playerLineupStatus?: PlayerLineupStatus | null;
  homeTeamId?: string | null;
  awayTeamId?: string | null;
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

function riskColor(risk?: string) {
  if (risk === "Low" || risk === "Lägre risk" || risk === "Lower risk") {
    return "border-green-500/30 bg-green-500/10 text-green-300";
  }

  if (risk === "High" || risk === "Högre risk" || risk === "Higher risk") {
    return "border-red-500/30 bg-red-500/10 text-red-300";
  }

  return "border-yellow-500/30 bg-yellow-500/10 text-yellow-200";
}

function injuryReason(injury: Injury, fallback: string) {
  return (
    injury.reason ||
    injury.player?.reason ||
    injury.player?.type ||
    injury.type ||
    fallback
  );
}

function AnalyzePageContent() {
  const { t, language } = useLanguage();
  const searchParams = useSearchParams();

  const [betText, setBetText] = useState("");
  const [inputMode, setInputMode] = useState<"text" | "image">(() => {
    if (typeof window === "undefined") {
      return "text";
    }

    const modeParam = new URLSearchParams(window.location.search).get("mode");
    if (modeParam === "image" || modeParam === "text") {
      return modeParam;
    }

    const saved = sessionStorage.getItem(ANALYZE_INPUT_MODE_KEY);
    return saved === "image" ? "image" : "text";
  });
  const [imageWarning, setImageWarning] = useState<string | null>(null);
  const [showParsedHint, setShowParsedHint] = useState(false);
  const [parsingImage, setParsingImage] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [usedData, setUsedData] = useState<UsedData | null>(null);
  const [premiumError, setPremiumError] = useState("");
  const [analysisError, setAnalysisError] = useState("");
  const [saveWarning, setSaveWarning] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [plan, setPlan] = useState<"free" | "pro" | "elite">("free");
  const [remainingToday, setRemainingToday] = useState<number | null>(null);
  const [isSampleReport, setIsSampleReport] = useState(false);

  useEffect(() => {
    if (searchParams.get("sample") !== "1") {
      return;
    }

    const sample = getSampleAnalysis(language);
    setBetText(sample.betText);
    setAiResult({
      summary: sample.summary,
      strengths: sample.strengths,
      risks: sample.risks,
      recommendation: sample.recommendation,
      brainScore: sample.brainScore,
      riskLevel: sample.riskLevel,
      confidence: sample.confidence,
      worthBetting: sample.worthBetting,
      brainPicks: sample.brainPicks,
    });
    setShowReport(true);
    setIsSampleReport(true);
  }, [searchParams, language]);

  useEffect(() => {
    const text = searchParams.get("text");
    const draft = sessionStorage.getItem(ANALYZE_DRAFT_KEY);

    if (text) {
      setBetText(text);
    } else if (draft) {
      setBetText(draft);
      sessionStorage.removeItem(ANALYZE_DRAFT_KEY);
    }
  }, [searchParams]);

  useEffect(() => {
    const modeParam = searchParams.get("mode");
    if (modeParam === "image" || modeParam === "text") {
      setInputMode(modeParam);
      sessionStorage.setItem(ANALYZE_INPUT_MODE_KEY, modeParam);
      return;
    }

    const saved = sessionStorage.getItem(ANALYZE_INPUT_MODE_KEY);
    if (saved === "image" || saved === "text") {
      setInputMode(saved);
    }
  }, [searchParams]);

  function selectInputMode(mode: "text" | "image") {
    setInputMode(mode);
    sessionStorage.setItem(ANALYZE_INPUT_MODE_KEY, mode);

    const nextUrl =
      mode === "image" ? "/analyze?mode=image" : "/analyze";
    window.history.replaceState(null, "", nextUrl);
    window.dispatchEvent(new CustomEvent("brainstats-analyze-mode"));
  }

  const analyzeLoginNext =
    inputMode === "image" ? "/analyze?mode=image" : "/analyze";

  useEffect(() => {
    let cancelled = false;

    async function loadUsage() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (!user) {
        setIsLoggedIn(false);
        setRemainingToday(null);
        return;
      }

      setIsLoggedIn(true);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [todayResult, profileResult] = await Promise.all([
        supabase
          .from("analyses")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("created_at", today.toISOString()),
        supabase.from("profiles").select("plan").eq("id", user.id).maybeSingle(),
      ]);

      if (cancelled) return;

      const userPlan = profileResult.data?.plan;
      const resolvedPlan =
        userPlan === "pro" || userPlan === "elite" ? userPlan : "free";

      setPlan(resolvedPlan);
      setRemainingToday(
        resolvedPlan === "free"
          ? Math.max(0, 3 - (todayResult.count ?? 0))
          : null
      );
    }

    void loadUsage();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAnalyze() {
    setLoading(true);
    setShowReport(false);
    setIsSampleReport(false);
    setAiResult(null);
    setUsedData(null);
    setPremiumError("");
    setAnalysisError("");
    setSaveWarning("");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      sessionStorage.setItem(ANALYZE_DRAFT_KEY, betText);
      window.location.href = `/login?next=${encodeURIComponent(analyzeLoginNext)}`;
      return;
    }

    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ text: betText, language }),
    });

    const data = await response.json();

    if (data.premiumRequired) {
      setLoading(false);
      setPremiumError(data.error);
      setRemainingToday(0);
      return;
    }

    if (data.analysis) {
      setAiResult(data.analysis);
      setUsedData(data.usedData || null);
      setLoading(false);
      setShowReport(true);

      if (data.saveWarning || (!data.success && data.error)) {
        setSaveWarning(data.saveWarning || t.analyze.saveWarning);
      }

      if (plan === "free" && data.success !== false) {
        setRemainingToday((current) =>
          current === null ? null : Math.max(0, current - 1)
        );
      }

      return;
    }

    setLoading(false);
    setAnalysisError(data.error || t.analyze.analysisFailed);

    if (response.status === 401) {
      sessionStorage.setItem(ANALYZE_DRAFT_KEY, betText);
    }
  }

  const score = aiResult?.brainScore ?? 0;
  const confidence = aiResult?.confidence ?? 0;
  const risk = translateRiskLevel(aiResult?.riskLevel, t);
  const breakdown = aiResult?.scoreBreakdown || {};
  const homeLastMatches = usedData?.lastMatches?.home || [];
  const awayLastMatches = usedData?.lastMatches?.away || [];
  const injuries = usedData?.injuries || [];
const lineups = usedData?.lineups || [];
const homeLineup = lineups[0];
const awayLineup = lineups[1];
const confirmedLineups = usedData?.confirmedLineups === true;
const partialLineups = hasPartialLineups(lineups);
const playerLineupStatus = usedData?.playerLineupStatus ?? null;

const selectedPlayerId = useMemo(() => {
  const match = betText.match(/Player ID:\s*(\d+)/i);
  return match ? Number(match[1]) : null;
}, [betText]);

const weather = usedData?.weather;
const referee = usedData?.referee;
const rotationRisks = usedData?.rotationRisks || [];
const scheduleContext = usedData?.scheduleContext;
const scheduleTeamsChecked = usedData?.scheduleTeamsChecked || [];
const rotationSummaries = summarizeRotationRisksForUi(
  rotationRisks,
  language
);
const scheduleStatusMessage =
  scheduleContext === "checked_clear"
    ? formatTranslation(t.analyze.scheduleCheckedClear, {
        teams: scheduleTeamsChecked.join(", "),
      })
    : scheduleContext === "no_team"
      ? t.analyze.scheduleNoTeam
      : scheduleContext === "no_fixture"
        ? t.analyze.scheduleNoFixture
        : "";

const brainPicks = useMemo(() => {
  if (!aiResult) return [];

  if (Array.isArray(aiResult.brainPicks) && aiResult.brainPicks.length > 0) {
    return aiResult.brainPicks;
  }

  return aiResult.brainPick ? [aiResult.brainPick] : [];
}, [aiResult]);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#050505] text-[#FAFAF8]">
      <FootballBackground />

      <div className="relative z-10">
        <Navbar />

        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
          <section className="mobile-hero mt-4 overflow-hidden rounded-[2rem] border border-[#18ff6d22] bg-black/35 p-5 max-md:backdrop-blur-none backdrop-blur-xl shadow-[0_0_80px_rgba(24,255,109,.12)] sm:mt-14 sm:p-10 md:text-left">
  <div className="inline-flex rounded-full border border-[#18ff6d33] bg-[#18ff6d]/10 px-4 py-2 text-sm font-semibold text-[#18ff6d]">
    {t.analyze.badge}
  </div>

  <p className={`mt-4 text-sm uppercase tracking-[0.45em] max-md:hidden sm:mt-8 ${titleGradient}`}>
    {t.analyze.subtitle}
  </p>

  <h2 className="mt-3 max-w-5xl text-3xl font-black leading-tight max-md:leading-snug sm:mt-4 sm:text-6xl">
    {t.analyze.title}
  </h2>

  <p className="mt-4 max-w-2xl text-sm leading-7 text-[#A9A9A9] max-md:line-clamp-3 sm:mt-6 sm:text-lg sm:leading-8">
    {t.analyze.description}
  </p>

  <ResponsibleUseNotice className="mt-5 sm:mt-6" />

  <div className="mt-6 hidden gap-4 md:grid md:grid-cols-3">
    <div className="rounded-2xl border border-[#18ff6d22] bg-black/35 p-5">
      <p className="text-sm text-[#A9A9A9]">{t.analyze.aiEngine}</p>
      <p className="mt-2 text-2xl font-bold text-[#18ff6d]">{t.analyze.online}</p>
    </div>

    <div className="rounded-2xl border border-[#18ff6d22] bg-black/35 p-5">
      <p className="text-sm text-[#A9A9A9]">{t.analyze.dataSources}</p>
      <p className="mt-2 text-2xl font-bold text-[#18ff6d]">{t.analyze.live}</p>
    </div>

    <div className="rounded-2xl border border-[#18ff6d22] bg-black/35 p-5">
      <p className="text-sm text-[#A9A9A9]">{t.analyze.riskModel}</p>
      <p className="mt-2 text-2xl font-bold text-[#18ff6d]">{t.analyze.active}</p>
    </div>
  </div>
</section>

          <section className="mt-6 rounded-3xl border border-[#18ff6d22] bg-[#121212]/75 p-4 max-md:backdrop-blur-none backdrop-blur-xl sm:mt-10 sm:p-6">
            {isLoggedIn !== true && <AnalyzeQuickStart />}

            {isLoggedIn === false && (
              <div className="mb-5 rounded-2xl border border-[#18ff6d33] bg-[#18ff6d]/10 p-4">
                <h3 className="font-bold text-[#18ff6d]">
                  {t.analyze.loginRequiredTitle}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#A9A9A9]">
                  {t.analyze.loginRequiredDescription}
                </p>
                <Link
                  href={`/login?next=${encodeURIComponent(analyzeLoginNext)}`}
                  className="mt-4 inline-flex rounded-full bg-[#18ff6d] px-5 py-2.5 text-sm font-bold text-black transition hover:opacity-90"
                >
                  {t.analyze.loginToAnalyze}
                </Link>
                <Link
                  href="/analyze?sample=1"
                  className="mt-3 inline-flex text-sm font-bold text-[#72d5ff] hover:underline"
                >
                  {t.analyze.viewSampleReport} →
                </Link>
              </div>
            )}

            {isLoggedIn && plan === "free" && remainingToday !== null && (
              <div
                className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${
                  remainingToday <= 1
                    ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-200"
                    : "border-[#18ff6d33] bg-black/30 text-[#A9A9A9]"
                }`}
              >
                {remainingToday <= 1 && remainingToday > 0
                  ? formatTranslation(t.analyze.remainingAnalysesLow, {
                      remaining: remainingToday,
                    })
                  : formatTranslation(t.analyze.remainingAnalyses, {
                      remaining: remainingToday,
                      limit: 3,
                    })}

                <a
                  href="/premium"
                  className="mt-3 inline-flex rounded-xl border border-[#E8DCC8]/30 bg-[#E8DCC8]/10 px-4 py-2 text-xs font-bold text-[#F5EAD8] transition hover:bg-[#E8DCC8]/15"
                >
                  {t.analyze.upgradeTrialCta} →
                </a>
              </div>
            )}

            <div className="mb-5 flex gap-2 rounded-2xl border border-[#18ff6d22] bg-black/30 p-1">
              <button
                type="button"
                onClick={() => selectInputMode("text")}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition ${
                  inputMode === "text"
                    ? "bg-[#18ff6d]/15 text-[#18ff6d]"
                    : "text-[#A9A9A9] hover:text-white"
                }`}
              >
                📋 {t.analyze.inputModeText}
              </button>

              <button
                type="button"
                onClick={() => selectInputMode("image")}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition ${
                  inputMode === "image"
                    ? "bg-[#18ff6d]/15 text-[#18ff6d]"
                    : "text-[#A9A9A9] hover:text-white"
                }`}
              >
                📸 {t.analyze.inputModeImage}
              </button>
            </div>

            {inputMode === "image" ? (
              <div className="mb-5">
                <BetSlipImageUpload
                  disabled={
                    loading ||
                    parsingImage ||
                    remainingToday === 0 ||
                    isLoggedIn !== true
                  }
                  isLoggedIn={isLoggedIn}
                  onParsingChange={setParsingImage}
                  onError={(message) => {
                    if (message) {
                      setAnalysisError(message);
                    } else {
                      setAnalysisError("");
                    }
                  }}
                  onParsed={({ text, warning }) => {
                    setBetText(text);
                    setShowReport(false);
                    setAnalysisError("");
                    setShowParsedHint(true);
                    setImageWarning(
                      warning === "fixture_not_found"
                        ? t.analyze.imageFixtureWarning
                        : warning === "multiple_matches"
                          ? t.analyze.imageMultipleMatchesWarning
                          : null
                    );
                  }}
                />
              </div>
            ) : null}

            {imageWarning ? (
              <div className="mb-5 rounded-2xl border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm text-yellow-100">
                {imageWarning}
              </div>
            ) : null}

            {showParsedHint && betText ? (
              <p className="mb-4 text-sm text-[#18ff6d]">
                {t.analyze.imageParsedHint}
              </p>
            ) : null}

            <textarea
              value={betText}
              onChange={(e) => {
                setBetText(e.target.value);
                setShowReport(false);
                setImageWarning(null);
                setShowParsedHint(false);
              }}
              placeholder={
                inputMode === "image"
                  ? t.analyze.imageTextareaPlaceholder
                  : t.analyze.placeholder
              }
              className="min-h-40 w-full resize-none rounded-2xl border border-[#18ff6d22] bg-black/40 p-4 text-white outline-none placeholder:text-[#666] sm:min-h-64 sm:p-5"
            />

            {analysisError ? (
              <div className="mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
                {analysisError}
              </div>
            ) : null}

            <Button
              onClick={handleAnalyze}
              disabled={
                !betText.trim() ||
                loading ||
                parsingImage ||
                remainingToday === 0
              }
              className="mt-5 w-full py-4"
            >
              {loading ? t.analyze.analyzing : t.analyze.runEngine}
            </Button>
          </section>

          {loading && (
            <section className="mt-8 rounded-3xl border border-[#18ff6d22] bg-[#121212]/75 p-6 max-md:backdrop-blur-none backdrop-blur-xl">
              <p className={titleGradient}>{t.analyze.loadingReport}</p>
            </section>
          )}

{premiumError && (
  <section className="mt-8 rounded-3xl border border-yellow-500/40 bg-yellow-500/10 p-8 text-center">
    <h2 className="text-3xl font-bold text-yellow-300">
      {t.analyze.premiumRequired}
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
      {t.analyze.upgradePro}
    </Button>
  </section>
)}

          {showReport && aiResult && (
            <section className="mt-8 space-y-8">
              {saveWarning ? (
                <div className="rounded-2xl border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm text-yellow-100">
                  {t.analyze.saveWarning}
                </div>
              ) : null}

              {isSampleReport ? (
                <div className="rounded-2xl border border-[#2fbfff33] bg-[#071018]/90 p-5">
                  <p className="text-sm leading-7 text-[#D8D8D8]">
                    {t.analyze.sampleBanner}
                  </p>
                  <Link
                    href={`/login?next=${encodeURIComponent(analyzeLoginNext)}`}
                    className="mt-4 inline-flex rounded-full bg-[#18ff6d] px-5 py-2.5 text-sm font-bold text-black transition hover:opacity-90"
                  >
                    {t.analyze.sampleCta}
                  </Link>
                </div>
              ) : null}

              <div className="brain-card overflow-hidden rounded-[2rem] p-6 sm:p-10">
                <p className={`text-sm uppercase tracking-[0.45em] ${titleGradient}`}>
                  {t.analyze.reportSubtitle}
                </p>
                <h2 className="mt-4 text-3xl font-black sm:text-5xl">
                  {t.analyze.reportTitle}
                </h2>
              </div>

              <AnalysisExecutiveSummary
                summary={aiResult.summary}
                brainScore={score}
                riskLevel={aiResult.riskLevel}
                confidence={confidence}
                worthBetting={aiResult.worthBetting ?? null}
              />

              <section id="brain-picks" className="scroll-mt-28">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className={`text-sm uppercase tracking-[0.25em] ${titleGradient}`}>
                      {t.report.picksSubtitle}
                    </p>
                    <h3 className="mt-2 text-2xl font-black text-white sm:text-3xl">
                      {t.report.picksTitle}
                    </h3>
                  </div>
                  <p className="text-sm text-[#A9A9A9]">{t.report.fairOddsNote}</p>
                </div>

                {brainPicks.length === 0 ? (
                  <div className="mt-6 rounded-3xl border border-white/10 bg-black/30 p-8">
                    <p className="text-[#A9A9A9]">{t.report.noPicks}</p>
                  </div>
                ) : (
                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    {brainPicks.map((pick, index) => (
                      <article
                        key={`${pick.market}-${index}`}
                        className="brain-card relative overflow-hidden rounded-3xl border border-[#18ff6d22] p-6 sm:p-7"
                      >
                        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#18ff6d]/10 blur-[70px]" />

                        <div className="relative">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <span className="rounded-full border border-[#18ff6d33] bg-[#18ff6d]/10 px-4 py-2 text-sm font-black text-[#18ff6d]">
                              {formatTranslation(t.report.pickNumber, {
                                n: index + 1,
                              })}
                            </span>

                            <span
                              className={`rounded-full border px-4 py-2 text-sm font-bold ${riskColor(
                                pick.riskLevel
                              )}`}
                            >
                              {translateRiskLevel(pick.riskLevel, t)}{" "}
                              {t.common.riskSuffix}
                            </span>
                          </div>

                          <h4 className="mt-6 text-2xl font-black text-white sm:text-3xl">
                            {pick.market || t.report.unknownMarket}
                          </h4>

                          <div className="mt-6 grid gap-4 sm:grid-cols-2">
                            <div className="rounded-2xl border border-[#18ff6d22] bg-black/35 p-5">
                              <p className="text-sm text-[#A9A9A9]">
                                {t.report.aiProbability}
                              </p>
                              <p className="mt-2 text-3xl font-black text-[#18ff6d]">
                                {pick.probability ?? pick.confidence ?? 0}%
                              </p>
                            </div>

                            <div className="rounded-2xl border border-[#2fbfff33] bg-black/35 p-5">
                              <p className="text-sm text-[#A9A9A9]">
                                {t.report.estimatedFairOdds}
                              </p>
                              <p className="mt-2 text-3xl font-black text-[#72d5ff]">
                                {Number(pick.estimatedOdds || 0).toFixed(2)}
                              </p>
                            </div>
                          </div>

                          <p className="mt-6 leading-8 text-[#D8D8D8]">
                            {pick.reason || t.report.noReason}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <CollapsibleReportSection title={t.analyze.detailsSection} defaultOpen>
              {(rotationSummaries.length > 0 || scheduleStatusMessage) ? (
                <div
                  className={`mb-6 rounded-3xl border p-6 sm:p-8 ${
                    rotationSummaries.length > 0
                      ? "border-yellow-500/30 bg-yellow-500/10"
                      : "border-white/10 bg-black/30"
                  }`}
                >
                  <p className={`text-sm uppercase tracking-[0.25em] ${titleGradient}`}>
                    {t.analyze.scheduleContextTitle}
                  </p>
                  <p className="mt-2 text-sm text-[#A9A9A9]">
                    {t.analyze.scheduleContextHint}
                  </p>
                  {rotationSummaries.length > 0 ? (
                    <ul className="mt-4 space-y-3">
                      {rotationSummaries.map((item) => (
                        <li
                          key={item}
                          className="rounded-2xl border border-yellow-500/20 bg-black/30 px-4 py-3 text-sm leading-6 text-[#E8E8E8]"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-[#A9A9A9]">
                      {scheduleStatusMessage}
                    </p>
                  )}
                </div>
              ) : null}

<div className="grid gap-6 md:grid-cols-2">
  <div className={cardClass}>
    <p
      className={`text-sm uppercase tracking-[0.25em] ${titleGradient}`}
    >
      {t.analyze.scoreBreakdownBadge}
    </p>

    <h3 className="mt-2 text-2xl font-bold text-white">
      <span className="mr-2">📊</span>
      {t.analyze.scoreBreakdownTitle}
    </h3>

    <div className="mt-6 space-y-5">
      {Object.entries(breakdown).map(([key, value]) => (
        <div key={key}>
          <div className="mb-2 flex justify-between text-sm">
            <span className="capitalize text-[#A9A9A9]">
              {translateBreakdownKey(key, t)}
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
          {t.analyze.startingXiBadge}
        </p>

        <h3 className="mt-2 text-2xl font-bold text-white">
          <span className="mr-2">👥</span>
          {t.analyze.startingXi}
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
          ? t.analyze.confirmed
          : t.analyze.awaiting}
      </span>
    </div>

    {!confirmedLineups && !partialLineups ? (
      <div className="mt-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5">
        <p className="font-semibold text-yellow-200">
          {t.analyze.lineupsNotPublished}
        </p>

        <p className="mt-2 text-sm leading-6 text-[#A9A9A9]">
          {t.analyze.lineupsHint}
        </p>
      </div>
    ) : (
      <div className="mt-6 space-y-6">
        {playerLineupStatus === "bench" ? (
          <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-100">
            {t.analyze.playerOnBenchWarningReport}
          </div>
        ) : null}

        {playerLineupStatus === "not_in_squad" ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
            {t.analyze.playerNotStartingWarningReport}
          </div>
        ) : null}

        {[homeLineup, awayLineup]
          .filter((lineup) => (lineup?.startXI?.length ?? 0) > 0)
          .map((lineup, teamIndex) => (
          <div
            key={lineup?.team?.id || teamIndex}
            className="overflow-hidden rounded-2xl border border-[#18ff6d22] bg-black/35"
          >
            <div className="flex items-center gap-4 border-b border-white/10 p-5">
              {lineup?.team?.logo && (
                <img
                  src={lineup.team.logo}
                  alt={lineup.team.name || t.common.teamAlt}
                  className="h-12 w-12 rounded-full bg-white p-1"
                />
              )}

              <div>
                <p className="text-lg font-black text-white">
                  {lineup?.team?.name ||
                    (teamIndex === 0
                      ? t.analyze.homeTeam
                      : t.analyze.awayTeam)}
                </p>

                <p className="mt-1 text-sm text-[#18ff6d]">
                  {t.analyze.formation}{" "}
                  {lineup?.formation || t.analyze.notSpecified}
                </p>

                {lineup?.coach?.name && (
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

              <div className="mt-4 space-y-2">
                {(lineup?.startXI || []).map(
                  (player, playerIndex) => (
                    <div
                      key={
                        player.id ||
                        `${player.name}-${playerIndex}`
                      }
                      className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                        selectedPlayerId &&
                        player.id === selectedPlayerId
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

                        {selectedPlayerId &&
                        player.id === selectedPlayerId ? (
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
  </div>
</div>

              <div className="grid gap-6 md:grid-cols-2">
                {weather && (
                  <div className={cardClass}>
                    <p className={`text-sm uppercase tracking-[0.25em] ${titleGradient}`}>
                      {t.analyze.matchConditions}
                    </p>
                    <h3 className="mt-2 text-2xl font-bold text-white">
                      <span className="mr-2">🌦️</span>
                      {t.analyze.weather}
                    </h3>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      {[
                        [t.analyze.temperature, `${weather.temperature ?? "-"}°C`],
                        [t.analyze.weatherDesc, weather.description ?? "-"],
                        [t.analyze.wind, `${weather.wind ?? "-"} km/h`],
                        [t.analyze.humidity, `${weather.humidity ?? "-"}%`],
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
                      {t.analyze.matchOfficial}
                    </p>
                    <h3 className="mt-2 text-2xl font-bold text-white">
                      <span className="mr-2">👨‍⚖️</span>
                      {t.analyze.referee}
                    </h3>

                    <div className="mt-6 rounded-2xl border border-[#18ff6d11] bg-black/35 p-6">
                      <p className="text-sm text-[#A9A9A9]">
                        {t.analyze.matchOfficial}
                      </p>
                      <p className="mt-3 text-3xl font-bold text-[#18ff6d]">
                        {referee}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className={cardClass}>
                <p className={`text-sm uppercase tracking-[0.25em] ${titleGradient}`}>
                  {t.analyze.teamFormBadge}
                </p>
                <h3 className="mt-2 text-2xl font-bold text-white">
                  <span className="mr-2">📈</span>
                  {t.analyze.lastFiveMatches}
                </h3>

                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  {[
                    [t.analyze.homeTeam, homeLastMatches],
                    [t.analyze.awayTeam, awayLastMatches],
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
                            {t.analyze.noMatchData}
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
                  {t.analyze.injuries}
                </h3>

                <div className="mt-6 space-y-3">
                  {injuries.length === 0 ? (
                    <p className="text-sm text-[#A9A9A9]">
                      {t.analyze.noInjuries}
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
                            alt={injury.team.name || t.common.teamAlt}
                            className="h-9 w-9 rounded-full bg-white p-1"
                          />
                        )}

                        <div>
                          <p className="font-semibold text-[#18ff6d]">
                            {injury.player?.name || t.builder.unknownPlayer}
                          </p>
                          <p className="mt-1 text-[#D8D8D8]">
                            {injury.team?.name || t.analyze.unknownTeam}
                          </p>
                          <p className="mt-1 text-[#A9A9A9]">
                            {injuryReason(injury, t.analyze.noInjuryReason)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-black/20 p-4">
                <h3 className="text-lg font-bold text-white">
                  {t.analyze.yourBetIdea}
                </h3>
                <pre className="mt-3 whitespace-pre-wrap text-sm text-[#D8D8D8]">
                  {betText}
                </pre>
              </div>
              </CollapsibleReportSection>

              <div className="grid gap-6 md:grid-cols-2">
                <CollapsibleReportSection title={t.analyze.strengths} defaultOpen>
                  <ul className="space-y-3 text-[#D8D8D8]">
                    {aiResult.strengths.map((item) => (
                      <li key={item}>✓ {item}</li>
                    ))}
                  </ul>
                </CollapsibleReportSection>

                <CollapsibleReportSection title={t.analyze.risks} defaultOpen>
                  <ul className="space-y-3 text-[#D8D8D8]">
                    {aiResult.risks.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </CollapsibleReportSection>
              </div>

              <div className={cardClass}>
                <h3 className="text-2xl font-bold text-white">
                  <span className="mr-2">💡</span>
                  {t.analyze.recommendation}
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

function AnalyzeLoadingFallback() {
  const { t } = useLanguage();

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#050505] text-[#FAFAF8]">
      <FootballBackground />
      <div className="relative z-10">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-[#A9A9A9]">{t.analyze.suspenseLoading}</p>
        </div>
      </div>
    </main>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={<AnalyzeLoadingFallback />}>
      <AnalyzePageContent />
    </Suspense>
  );
}