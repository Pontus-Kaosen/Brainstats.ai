import Link from "next/link";
import Navbar from "@/components/Navbar";
import FootballBackground from "@/components/FootballBackground";
import HomeCtaLink from "@/components/HomeCtaLink";
import BrainStatsLogo from "@/components/BrainStatsLogo";
import TrackRecordSnippet from "@/components/TrackRecordSnippet";
import DailySlipsTeaser from "@/components/DailySlipsTeaser";
import { getHomeContent } from "@/lib/homeContent";
import { detectLanguage } from "@/lib/locale.server";

export default async function Home() {
  const language = await detectLanguage();
  const t = getHomeContent(language);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#050505] text-[#FAFAF8]">
      <FootballBackground />

      <div className="relative z-10">
        <Navbar />

        <section className="mx-auto flex max-w-7xl flex-col items-center px-4 py-10 text-center sm:px-8 sm:py-32">
          <p className="rounded-full border border-[#18ff6d33] bg-[#18ff6d]/10 px-4 py-2 text-xs font-semibold text-[#18ff6d] sm:text-sm">
            {t.badge}
          </p>

          <BrainStatsLogo
            variant="hero"
            className="mt-4 drop-shadow-[0_0_40px_rgba(24,255,109,0.25)] sm:mt-8"
          />

          <h1 className="mt-4 max-w-5xl text-3xl font-bold leading-tight max-md:leading-snug sm:mt-10 sm:text-6xl">
            {t.title}
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#A9A9A9] max-md:line-clamp-4 sm:mt-8 sm:text-lg sm:leading-8">
            {t.description}
          </p>

          <p className="mt-4 max-w-2xl rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-xs leading-6 text-[#A9A9A9] sm:text-sm">
            {t.trustStrip}
          </p>

          <div className="mt-6 grid w-full max-w-3xl grid-cols-1 gap-3 sm:mt-12 sm:grid-cols-2 sm:gap-4">
            <HomeCtaLink
              href="/login?next=/analyze%3Fmode%3Dimage"
              className="w-full sm:col-span-2"
            >
              📸 {t.uploadBetSlip}
            </HomeCtaLink>

            <HomeCtaLink href="/login?next=/analyze" className="w-full">
              ✨ {t.signupFree}
            </HomeCtaLink>

            <HomeCtaLink href="/analyze" className="w-full">
              📝 {t.pasteBet}
            </HomeCtaLink>

            <HomeCtaLink href="/analyze?sample=1" variant="secondary" className="w-full sm:col-span-2">
              🧠 {t.sampleReportCta}
            </HomeCtaLink>

            <HomeCtaLink
              href="/builder"
              variant="secondary"
              className="w-full sm:col-span-2"
            >
              ⚽ {t.buildBet}
            </HomeCtaLink>
          </div>

          <Link
            href="/premium"
            className="mt-6 block w-full max-w-3xl rounded-[2rem] border border-[#E8DCC8]/25 bg-gradient-to-br from-[#E8DCC8]/10 via-[#18ff6d]/5 to-[#2fbfff]/10 p-5 text-center transition hover:border-[#E8DCC8]/40 hover:shadow-[0_0_50px_rgba(232,220,200,.14)] sm:mt-8 sm:p-8 sm:text-left"
          >
            <p className="inline-flex rounded-full border border-[#E8DCC8]/30 bg-black/30 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-[#E8DCC8]">
              {t.trialBadge}
            </p>

            <h2 className="mt-4 text-2xl font-black text-white sm:text-3xl">
              {t.trialTitle}
            </h2>

            <p className="mt-3 text-sm leading-7 text-[#A9A9A9] sm:text-base">
              {t.trialText}
            </p>

            <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#E8DCC8] sm:text-base">
              {t.trialCta} →
            </span>
          </Link>

          <Link
            href="/premium"
            className="mt-4 text-sm font-semibold text-[#18ff6d] transition hover:underline sm:mt-5"
          >
            💎 {t.seePremium}
          </Link>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-8 sm:pb-16">
          <h2 className="text-center text-2xl font-black text-white sm:text-3xl">
            {t.howItWorksTitle}
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {t.howItWorksSteps.map((step) => (
              <article
                key={step.title}
                className="rounded-3xl border border-[#18ff6d22] bg-[#121212]/75 p-6"
              >
                <h3 className="text-lg font-bold text-[#18ff6d]">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#A9A9A9]">{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-8 sm:pb-16">
          <div className="grid gap-8 rounded-[2rem] border border-[#E8DCC8]/20 bg-gradient-to-br from-[#18ff6d]/5 via-black/40 to-[#2fbfff]/5 p-6 text-center sm:grid-cols-2 sm:p-10 sm:text-left">
            <div>
              <h2 className="text-2xl font-black text-white sm:text-3xl">
                {t.brainScoreTitle}
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#A9A9A9] sm:text-base">
                {t.brainScoreText}
              </p>
              <HomeCtaLink href="/analyze?sample=1" className="mt-6 inline-flex max-sm:mx-auto">
                {t.sampleReportCta}
              </HomeCtaLink>
              <HomeCtaLink href="/analyze" variant="secondary" className="mt-3 inline-flex max-sm:mx-auto sm:ml-4">
                {t.brainScoreCta}
              </HomeCtaLink>
            </div>
            <ul className="space-y-3 self-center">
              {t.brainScorePoints.map((point) => (
                <li
                  key={point}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-[#D8D8D8]"
                >
                  <span className="text-[#18ff6d]">✓</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-8 sm:pb-16">
          <Link
            href="/track-record"
            className="block rounded-[2rem] border border-white/10 bg-black/30 p-6 text-center transition hover:border-[#18ff6d44] sm:p-8 sm:text-left"
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#18ff6d]">
              📊 Transparency
            </p>
            <h2 className="mt-3 text-2xl font-black text-white">{t.trackRecordTitle}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#A9A9A9]">
              {t.trackRecordText}
            </p>
            <TrackRecordSnippet />
            <span className="mt-5 inline-flex text-sm font-bold text-[#18ff6d]">
              {t.trackRecordCta} →
            </span>
          </Link>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-8">
          <DailySlipsTeaser />
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-8 sm:pb-24">
          <div className="grid gap-4 md:grid-cols-3 md:gap-5">
            {t.features.map((card) => (
              <article
                key={card.title}
                className="rounded-3xl border border-white/5 bg-[#1A1A1A] p-4 text-center sm:p-8 md:text-left"
              >
                <h2 className="text-xl font-bold text-[#E8DCC8]">{card.title}</h2>

                <p className="mt-3 text-sm leading-6 text-[#A9A9A9] sm:mt-4 sm:leading-7">
                  {card.text}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
