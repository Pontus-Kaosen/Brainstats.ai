"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Button from "@/components/Button";
import FootballBackground from "@/components/FootballBackground";
import { useLanguage } from "@/components/LanguageProvider";
import { formatTranslation } from "@/lib/locale";
import {
  ANALYZE_DRAFT_KEY,
  ANALYZE_INPUT_MODE_KEY,
} from "@/lib/safeRedirect";
import BetSlipImageUpload from "@/components/BetSlipImageUpload";
import AnalyzeQuickStart from "@/components/AnalyzeQuickStart";
import ResponsibleUseNotice from "@/components/ResponsibleUseNotice";
import type { WorthBetting } from "@/lib/worthBetting";
import { getSampleAnalysis } from "@/lib/sampleAnalysis";
import AnalyzeMatchReport from "@/components/AnalyzeMatchReport";
import type { AnalysisUsedData, ScoreBreakdown } from "@/lib/analysisReportTypes";

type BrainPick = {
  market: string;
  confidence?: number;
  probability?: number;
  estimatedOdds?: number;
  riskLevel?: string;
  reason: string;
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

type MatchResult = {
  matchLabel: string;
  blockText: string;
  analysis: AIResult;
  usedData: AnalysisUsedData;
};

const titleGradient =
  "bg-gradient-to-r from-[#18ff6d] via-[#E8DCC8] to-[#2fbfff] bg-clip-text text-transparent";

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
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [premiumError, setPremiumError] = useState("");
  const [analysisError, setAnalysisError] = useState("");
  const [saveWarning, setSaveWarning] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [plan, setPlan] = useState<"free" | "pro" | "elite">("free");
  const [remainingToday, setRemainingToday] = useState<number | null>(null);
  const [totalAnalyses, setTotalAnalyses] = useState<number | null>(null);
  const [isSampleReport, setIsSampleReport] = useState(false);

  useEffect(() => {
    if (searchParams.get("sample") !== "1") {
      return;
    }

    const sample = getSampleAnalysis(language);
    setBetText(sample.betText);
    setMatchResults([
      {
        matchLabel: sample.betText.split("\n")[0]?.trim() || t.analyze.reportTitle,
        blockText: sample.betText,
        analysis: {
          summary: sample.summary,
          strengths: sample.strengths,
          risks: sample.risks,
          recommendation: sample.recommendation,
          brainScore: sample.brainScore,
          riskLevel: sample.riskLevel,
          confidence: sample.confidence,
          worthBetting: sample.worthBetting,
          brainPicks: sample.brainPicks,
        },
        usedData: {},
      },
    ]);
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

      const [todayResult, totalResult, profileResult] = await Promise.all([
        supabase
          .from("analyses")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("created_at", today.toISOString()),
        supabase
          .from("analyses")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase.from("profiles").select("plan").eq("id", user.id).maybeSingle(),
      ]);

      if (cancelled) return;

      const userPlan = profileResult.data?.plan;
      const resolvedPlan =
        userPlan === "pro" || userPlan === "elite" ? userPlan : "free";

      setPlan(resolvedPlan);
      setTotalAnalyses(totalResult.count ?? 0);
      setRemainingToday(
        resolvedPlan === "free"
          ? Math.max(0, 3 - (todayResult.count ?? 0))
          : null
      );
    }

    void loadUsage();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      void loadUsage();
    });

    return () => {
      cancelled = true;
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function handleAnalyze() {
    setLoading(true);
    setShowReport(false);
    setIsSampleReport(false);
    setAiResult(null);
    setMatchResults([]);
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
      const matches: MatchResult[] = Array.isArray(data.matches)
        ? data.matches.map(
            (entry: {
              matchLabel: string;
              blockText: string;
              analysis: AIResult;
              usedData: AnalysisUsedData;
            }) => ({
              matchLabel: entry.matchLabel,
              blockText: entry.blockText,
              analysis: entry.analysis,
              usedData: entry.usedData,
            })
          )
        : [
            {
              matchLabel: betText.split("\n")[0]?.trim() || t.analyze.reportTitle,
              blockText: betText,
              analysis: data.analysis,
              usedData: (data.usedData || {}) as AnalysisUsedData,
            },
          ];

      setMatchResults(matches);
      setAiResult(data.analysis);
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

  const reportEntries =
    matchResults.length > 0
      ? matchResults
      : aiResult
        ? [
            {
              matchLabel: betText.split("\n")[0]?.trim() || t.analyze.reportTitle,
              blockText: betText,
              analysis: aiResult,
              usedData: {} as AnalysisUsedData,
            },
          ]
        : [];

  return (
    <main className="brain-page relative min-h-screen overflow-x-hidden">
      <FootballBackground />

      <div className="relative z-10">
        <Navbar />

        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
          <section className="mobile-hero brain-section mt-4 overflow-hidden rounded-[2rem] p-5 shadow-[0_0_80px_rgba(24,255,109,.14)] sm:mt-14 sm:p-10 md:text-left">
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

  <div className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-3 sm:gap-4">
    <div className="brain-stat-tile rounded-2xl p-5">
      <p className="text-sm text-[#A9A9A9]">{t.analyze.aiEngine}</p>
      <p className="mt-2 text-2xl font-bold text-[#18ff6d]">{t.analyze.online}</p>
    </div>

    <div className="brain-stat-tile rounded-2xl p-5">
      <p className="text-sm text-[#A9A9A9]">{t.analyze.dataSources}</p>
      <p className="mt-2 text-2xl font-bold text-[#18ff6d]">{t.analyze.live}</p>
    </div>

    <div className="brain-stat-tile rounded-2xl p-5">
      <p className="text-sm text-[#A9A9A9]">{t.analyze.riskModel}</p>
      <p className="mt-2 text-2xl font-bold text-[#18ff6d]">{t.analyze.active}</p>
    </div>
  </div>
</section>

          <section className="brain-section mt-6 rounded-3xl p-4 sm:mt-10 sm:p-6">
            {(isLoggedIn !== true || totalAnalyses === 0) && !showReport ? (
              <AnalyzeQuickStart />
            ) : null}

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

            {remainingToday === 0 && plan === "free" && isLoggedIn ? (
              <div className="mt-5 rounded-2xl border border-[#E8DCC8]/30 bg-[#E8DCC8]/10 p-5 text-center">
                <h3 className="text-lg font-bold text-[#F5EAD8]">
                  {t.analyze.limitReachedTitle}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#D8D8D8]">
                  {t.analyze.limitReachedBody}
                </p>
                <Link
                  href="/premium"
                  className="mt-4 inline-flex rounded-full bg-[#18ff6d] px-5 py-2.5 text-sm font-bold text-black transition hover:opacity-90"
                >
                  {t.analyze.upgradeTrialCta} →
                </Link>
              </div>
            ) : (
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
            )}
          </section>

          {loading && (
            <section className="brain-section mt-8 rounded-3xl p-6">
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

          {showReport && reportEntries.length > 0 && (
            <section className="mt-6 space-y-5">
              {saveWarning ? (
                <div className="rounded-2xl border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm text-yellow-100">
                  {t.analyze.saveWarning}
                </div>
              ) : null}

              {isSampleReport && isLoggedIn === false ? (
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

              {reportEntries.length > 1 ? (
                <nav className="sticky top-16 z-20 flex flex-wrap gap-2 rounded-2xl border border-[#2fbfff33] bg-[#0b1a28]/95 p-3 backdrop-blur-md">
                  {reportEntries.map((entry, index) => (
                    <a
                      key={`${entry.matchLabel}-nav-${index}`}
                      href={`#match-report-${index}`}
                      className="rounded-full border border-[#18ff6d33] bg-[#18ff6d]/10 px-3 py-1.5 text-xs font-bold text-[#18ff6d] transition hover:bg-[#18ff6d]/15 sm:text-sm"
                    >
                      {entry.matchLabel}
                    </a>
                  ))}
                </nav>
              ) : null}

              {reportEntries.map((entry, index) => (
                <div
                  key={`${entry.matchLabel}-${index}`}
                  className={index > 0 ? "border-t border-white/10 pt-6" : ""}
                >
                  <AnalyzeMatchReport
                    matchLabel={entry.matchLabel}
                    aiResult={entry.analysis}
                    usedData={entry.usedData}
                    blockBetText={entry.blockText}
                    showMatchHeading={reportEntries.length > 1}
                    sectionId={`match-report-${index}`}
                  />
                </div>
              ))}
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
    <main className="brain-page relative min-h-screen overflow-x-hidden">
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