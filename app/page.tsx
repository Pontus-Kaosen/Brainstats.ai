import Link from "next/link";
import Navbar from "@/components/Navbar";
import FootballBackground from "@/components/FootballBackground";
import HomeCtaLink from "@/components/HomeCtaLink";
import BrainStatsLogo from "@/components/BrainStatsLogo";
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

          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#A9A9A9] max-md:line-clamp-3 sm:mt-8 sm:text-lg sm:leading-8">
            {t.description}
          </p>

          <p className="mt-4 max-w-2xl rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-xs leading-6 text-[#A9A9A9] sm:text-sm">
            {t.trustStrip}
          </p>

          <div className="mt-6 flex w-full flex-col justify-center gap-3 sm:mt-12 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-5">
            <HomeCtaLink href="/analyze" className="w-full sm:w-auto">
              📝 {t.pasteBet}
            </HomeCtaLink>

            <HomeCtaLink
              href="/builder"
              variant="secondary"
              className="w-full sm:w-auto"
            >
              ⚽ {t.buildBet}
            </HomeCtaLink>
          </div>

          <Link
            href="/premium"
            className="mt-4 text-sm font-semibold text-[#18ff6d] transition hover:underline sm:mt-6"
          >
            💎 {t.seePremium}
          </Link>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-8 sm:pb-24">
          <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 snap-x snap-mandatory max-md:scrollbar-none md:grid md:grid-cols-3 md:gap-5 md:overflow-visible">
            {t.features.map((card) => (
              <article
                key={card.title}
                className="min-w-[78vw] shrink-0 snap-center rounded-3xl border border-white/5 bg-[#1A1A1A] p-4 max-md:last:mr-1 md:min-w-0 sm:p-8"
              >
                <h2 className="text-xl font-bold text-[#E8DCC8]">
                  {card.title}
                </h2>

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
