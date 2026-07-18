import Link from "next/link";
import Navbar from "@/components/Navbar";
import FootballBackground from "@/components/FootballBackground";
import HomeCtaLink from "@/components/HomeCtaLink";
import { getTrackRecordPageData } from "@/lib/trackRecordData";
import { detectLanguage } from "@/lib/locale.server";
import { createPageMetadata } from "@/lib/seo";
import { getOutcomeLabelForTier, getSafetyGrade } from "@/lib/safetyGrades";

export async function generateMetadata() {
  const language = await detectLanguage();
  const t = await getTrackRecordPageData(language);

  return createPageMetadata({
    title: t.title,
    description: t.description,
    path: "/track-record",
  });
}

function outcomeClass(outcome: string) {
  if (outcome === "won") return "text-[#18ff6d]";
  if (outcome === "lost") return "text-red-400";
  if (outcome === "pending") return "text-[#E8DCC8]";
  return "text-[#A9A9A9]";
}

export default async function TrackRecordPage() {
  const language = await detectLanguage();
  const t = await getTrackRecordPageData(language);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#050505] text-[#FAFAF8]">
      <FootballBackground />

      <div className="relative z-10">
        <Navbar />

        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8 sm:py-16">
          <section className="text-center">
            <p className="inline-flex rounded-full border border-[#18ff6d33] bg-[#18ff6d]/10 px-4 py-2 text-sm font-semibold text-[#18ff6d]">
              {t.badge}
            </p>
            <h1 className="mt-5 text-3xl font-black sm:text-5xl">{t.title}</h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-[#A9A9A9]">
              {t.description}
            </p>
            {t.usingLiveData ? (
              <p className="mx-auto mt-3 inline-flex rounded-full border border-[#18ff6d33] bg-[#18ff6d]/10 px-4 py-2 text-xs font-semibold text-[#18ff6d]">
                Live data
              </p>
            ) : null}
          </section>

          {t.stats && t.stats.resolved > 0 ? (
            <section className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.5rem] border border-[#18ff6d22] bg-[#121212]/75 p-5 text-center">
                <p className="text-xs uppercase tracking-[0.18em] text-[#747474]">
                  {t.statsHitRate}
                </p>
                <p className="mt-2 text-3xl font-black text-[#18ff6d]">
                  {t.stats.hitRate != null ? `${t.stats.hitRate}%` : "—"}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-black/30 p-5 text-center">
                <p className="text-xs uppercase tracking-[0.18em] text-[#747474]">
                  {t.statsResolved}
                </p>
                <p className="mt-2 text-3xl font-black text-white">
                  {t.stats.hits}/{t.stats.hits + t.stats.misses}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-black/30 p-5 text-center">
                <p className="text-xs uppercase tracking-[0.18em] text-[#747474]">
                  {t.statsPending}
                </p>
                <p className="mt-2 text-3xl font-black text-[#E8DCC8]">
                  {t.stats.pending}
                </p>
              </div>
            </section>
          ) : null}

          <section className="mt-10 rounded-[2rem] border border-white/10 bg-black/30 p-6 text-center sm:p-8 sm:text-left">
            <h2 className="text-xl font-black text-white">{t.howTitle}</h2>
            <ol className="mt-4 space-y-3">
              {t.howSteps.map((step, i) => (
                <li
                  key={step}
                  className="flex gap-3 text-sm leading-7 text-[#D8D8D8]"
                >
                  <span className="font-black text-[#18ff6d]">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-8 overflow-x-auto rounded-[2rem] border border-[#18ff6d22] bg-[#121212]/75">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-[0.15em] text-[#747474]">
                  <th className="px-4 py-4 sm:px-6">{t.tableHeaders.date}</th>
                  <th className="px-4 py-4 sm:px-6">{t.tableHeaders.match}</th>
                  <th className="hidden px-4 py-4 sm:table-cell sm:px-6">
                    {t.tableHeaders.pick}
                  </th>
                  <th className="px-4 py-4 sm:px-6">{t.tableHeaders.score}</th>
                  <th className="hidden px-4 py-4 md:table-cell md:px-6">
                    {t.tableHeaders.safetyGrade}
                  </th>
                  <th className="px-4 py-4 sm:px-6">{t.tableHeaders.result}</th>
                </tr>
              </thead>
              <tbody>
                {t.entries.map((entry) => {
                  const grade = getSafetyGrade(entry.safetyTier, language);
                  const missLabel = getOutcomeLabelForTier(
                    entry.safetyTier,
                    entry.outcome,
                    language
                  );

                  return (
                    <tr
                      key={`${entry.date}-${entry.match}-${entry.market}`}
                      className="border-b border-white/5 transition hover:bg-white/[0.02]"
                    >
                      <td className="px-4 py-4 text-[#A9A9A9] sm:px-6">
                        {entry.date}
                      </td>
                      <td className="px-4 py-4 sm:px-6">
                        <p className="font-semibold text-white">{entry.match}</p>
                        <p className="mt-1 text-xs text-[#888] sm:hidden">
                          {entry.market}
                        </p>
                        <p className="mt-1 hidden text-xs text-[#777] sm:block">
                          {entry.note}
                        </p>
                      </td>
                      <td className="hidden px-4 py-4 text-[#D8D8D8] sm:table-cell sm:px-6">
                        {entry.market}
                      </td>
                      <td className="px-4 py-4 font-black text-[#18ff6d] sm:px-6">
                        {entry.brainScore}
                      </td>
                      <td className="hidden px-4 py-4 text-[#A9A9A9] md:table-cell md:px-6">
                        {grade.label}
                      </td>
                      <td
                        className={`px-4 py-4 font-bold sm:px-6 ${outcomeClass(entry.outcome)}`}
                      >
                        <p>{t.outcomeLabels[entry.outcome]}</p>
                        {missLabel && (
                          <p className="mt-1 text-xs font-semibold text-red-300/90">
                            {missLabel}
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          <p className="mt-4 text-center text-xs text-[#666]">{t.emptyNote}</p>

          <p className="mt-6 text-center text-sm leading-7 text-[#777]">
            {t.disclaimer}
          </p>

          <section className="mt-10 rounded-[2rem] border border-[#E8DCC8]/25 bg-gradient-to-r from-[#E8DCC8]/10 via-[#18ff6d]/5 to-transparent p-6 text-center sm:p-10">
            <h2 className="text-2xl font-black text-white">{t.ctaTitle}</h2>
            <p className="mt-3 text-[#A9A9A9]">{t.ctaText}</p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <HomeCtaLink href="/analyze?mode=image">{t.ctaAnalyze}</HomeCtaLink>
              <HomeCtaLink href="/premium" variant="secondary">
                {t.ctaPremium}
              </HomeCtaLink>
            </div>
          </section>

          <p className="mt-8 text-center">
            <Link href="/" className="text-sm text-[#18ff6d] hover:underline">
              ← brainstats.eu
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
