import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import FootballBackground from "@/components/FootballBackground";

type ReportProps = {
  params: Promise<{
    id: string;
  }>;
};

type BrainPick = {
  id?: number;
  market?: string;
  probability?: number;
  estimatedOdds?: number;
  riskLevel?: string;
  reason?: string;
};

const titleGradient =
  "bg-gradient-to-r from-[#18ff6d] via-[#E8DCC8] to-[#2fbfff] bg-clip-text text-transparent";

const cardClass =
  "brain-card rounded-3xl p-6 sm:p-8";

function riskColor(risk?: string) {
  if (risk === "Low") {
    return "border-[#18ff6d44] bg-[#18ff6d]/10 text-[#18ff6d]";
  }

  if (risk === "High") {
    return "border-red-500/40 bg-red-500/10 text-red-300";
  }

  return "border-yellow-500/40 bg-yellow-500/10 text-yellow-300";
}

export default async function ReportPage({ params }: ReportProps) {
  const { id } = await params;

  const { data: analysis, error } = await supabase
    .from("analyses")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !analysis) {
    return (
      <main className="min-h-screen bg-[#050505] px-4 py-10 text-white sm:px-8">
        <div className="mx-auto max-w-5xl">
          <a
            href="/dashboard"
            className="font-semibold text-[#18ff6d] hover:underline"
          >
            ← Till Dashboard
          </a>

          <section className="mt-10 rounded-3xl border border-red-500/30 bg-red-500/10 p-8">
            <h1 className="text-4xl font-black">
              Rapporten hittades inte
            </h1>

            <p className="mt-4 text-red-200/80">
              Analysen finns inte eller kunde inte hämtas.
            </p>
          </section>
        </div>
      </main>
    );
  }

  const brainPicks: BrainPick[] = Array.isArray(analysis.brain_picks)
    ? analysis.brain_picks
    : [];

  const strengths: string[] = Array.isArray(analysis.strengths)
    ? analysis.strengths
    : [];

  const risks: string[] = Array.isArray(analysis.risks)
    ? analysis.risks
    : [];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-[#FAFAF8]">
      <FootballBackground />

      <div className="relative z-10">
        <Navbar />

        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <a
              href="/dashboard"
              className="font-semibold text-[#18ff6d] transition hover:opacity-75"
            >
              ← Till Dashboard
            </a>

            <div className="rounded-full border border-[#18ff6d33] bg-[#18ff6d]/10 px-4 py-2 text-sm font-semibold text-[#18ff6d]">
              🧠 BrainStats Report
            </div>
          </div>

          <section className="mt-8 overflow-hidden rounded-[2rem] border border-[#18ff6d22] bg-black/35 p-7 backdrop-blur-xl shadow-[0_0_80px_rgba(24,255,109,.12)] sm:p-10">
            <p
              className={`text-sm uppercase tracking-[0.35em] ${titleGradient}`}
            >
              AI Match Insight
            </p>

            <h1 className="mt-5 text-4xl font-black sm:text-6xl">
              {analysis.match || "Okänd match"}
            </h1>

            <p className="mt-5 max-w-3xl leading-8 text-[#A9A9A9]">
              AI-genererad analys baserad på matchdata, form,
              tabell, H2H och vald marknad.
            </p>

            <p className="mt-3 max-w-3xl text-sm text-[#777]">
              BrainStats erbjuder analys och information. Vi tar inte
              emot spel, insatser eller utbetalningar.
            </p>
          </section>

          <section className="mt-8 grid gap-6 md:grid-cols-3">
            <div className={cardClass}>
              <p className="text-sm text-[#A9A9A9]">
                BrainScore™
              </p>

              <h2 className="mt-3 text-6xl font-black text-[#18ff6d] drop-shadow-[0_0_35px_rgba(24,255,109,.5)]">
                {analysis.score ?? 0}
              </h2>

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-black/50">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#18ff6d] to-[#2fbfff]"
                  style={{
                    width: `${Math.min(
                      Number(analysis.score || 0),
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className={cardClass}>
              <p className="text-sm text-[#A9A9A9]">
                Risknivå
              </p>

              <div
                className={`mt-5 inline-flex rounded-full border px-5 py-3 text-2xl font-black ${riskColor(
                  analysis.risk
                )}`}
              >
                {analysis.risk || "Unknown"}
              </div>
            </div>

            <div className={cardClass}>
              <p className="text-sm text-[#A9A9A9]">
                Confidence
              </p>

              <h2 className="mt-3 text-5xl font-black text-[#18ff6d]">
                {analysis.confidence ?? 0}%
              </h2>
            </div>
          </section>

          <section className={`mt-8 ${cardClass}`}>
            <p
              className={`text-sm uppercase tracking-[0.25em] ${titleGradient}`}
            >
              AI Summary
            </p>

            <h2 className="mt-2 text-2xl font-black">
              💡 Sammanfattning
            </h2>

            <p className="mt-6 whitespace-pre-wrap leading-8 text-[#D8D8D8]">
              {analysis.summary || "Ingen sammanfattning tillgänglig."}
            </p>
          </section>

          <section className="mt-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p
                  className={`text-sm uppercase tracking-[0.25em] ${titleGradient}`}
                >
                  Brain Picks
                </p>

                <h2 className="mt-2 text-3xl font-black">
                  🎯 AI:s spelförslag
                </h2>
              </div>

              <p className="text-sm text-[#A9A9A9]">
                Estimerat fair odds – inte ett liveodds
              </p>
            </div>

            {brainPicks.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-white/10 bg-black/30 p-8">
                <p className="text-[#A9A9A9]">
                  Den här äldre analysen innehåller inga sparade
                  Brain Picks. Gör en ny analys för att se de nya
                  förslagen och estimerade oddsen.
                </p>
              </div>
            ) : (
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                {brainPicks.map((pick, index) => (
                  <article
                    key={`${pick.market}-${index}`}
                    className="brain-card relative overflow-hidden rounded-3xl border border-[#18ff6d22] p-7"
                  >
                    <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#18ff6d]/10 blur-[70px]" />

                    <div className="relative">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="rounded-full border border-[#18ff6d33] bg-[#18ff6d]/10 px-4 py-2 text-sm font-black text-[#18ff6d]">
                          Brain Pick #{index + 1}
                        </span>

                        <span
                          className={`rounded-full border px-4 py-2 text-sm font-bold ${riskColor(
                            pick.riskLevel
                          )}`}
                        >
                          {pick.riskLevel || "Medium"} risk
                        </span>
                      </div>

                      <h3 className="mt-6 text-3xl font-black text-white">
                        {pick.market || "Okänd marknad"}
                      </h3>

                      <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl border border-[#18ff6d22] bg-black/35 p-5">
                          <p className="text-sm text-[#A9A9A9]">
                            AI-sannolikhet
                          </p>

                          <p className="mt-2 text-3xl font-black text-[#18ff6d]">
                            {pick.probability ?? 0}%
                          </p>
                        </div>

                        <div className="rounded-2xl border border-[#2fbfff33] bg-black/35 p-5">
                          <p className="text-sm text-[#A9A9A9]">
                            Estimerat fair odds
                          </p>

                          <p className="mt-2 text-3xl font-black text-[#72d5ff]">
                            {Number(
                              pick.estimatedOdds || 0
                            ).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <p className="mt-6 leading-8 text-[#D8D8D8]">
                        {pick.reason ||
                          "Ingen motivering tillgänglig."}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="mt-8 grid gap-6 md:grid-cols-2">
            <div className={cardClass}>
              <h2 className="text-2xl font-black">
                ✅ Styrkor
              </h2>

              {strengths.length === 0 ? (
                <p className="mt-5 text-[#A9A9A9]">
                  Inga styrkor tillgängliga.
                </p>
              ) : (
                <ul className="mt-5 space-y-4 text-[#D8D8D8]">
                  {strengths.map((item, index) => (
                    <li
                      key={`${item}-${index}`}
                      className="flex gap-3"
                    >
                      <span className="text-[#18ff6d]">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className={cardClass}>
              <h2 className="text-2xl font-black">
                ⚠ Risker
              </h2>

              {risks.length === 0 ? (
                <p className="mt-5 text-[#A9A9A9]">
                  Inga risker tillgängliga.
                </p>
              ) : (
                <ul className="mt-5 space-y-4 text-[#D8D8D8]">
                  {risks.map((item, index) => (
                    <li
                      key={`${item}-${index}`}
                      className="flex gap-3"
                    >
                      <span className="text-yellow-300">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="mt-8 rounded-3xl border border-[#18ff6d33] bg-[#07140d]/80 p-7 sm:p-8">
            <p
              className={`text-sm uppercase tracking-[0.25em] ${titleGradient}`}
            >
              Final Verdict
            </p>

            <h2 className="mt-2 text-2xl font-black">
              🎯 Rekommendation
            </h2>

            <p className="mt-5 whitespace-pre-wrap leading-8 text-[#D8D8D8]">
              {analysis.recommendation ||
                "Ingen rekommendation tillgänglig."}
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}