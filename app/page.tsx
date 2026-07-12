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

        <section className="mx-auto flex max-w-7xl flex-col items-center px-4 py-20 text-center sm:px-8 sm:py-32">
          <BrainStatsLogo variant="hero" />

          <h1 className="mt-6 max-w-5xl text-4xl font-bold leading-tight sm:mt-8 sm:text-6xl">
            {t.title}
          </h1>

          <p className="mt-8 max-w-2xl text-base leading-8 text-[#A9A9A9] sm:text-lg">
            {t.description}
          </p>

          <div className="mt-12 flex w-full flex-col justify-center gap-4 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-5">
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

            <HomeCtaLink
              href="/premium"
              variant="secondary"
              className="w-full sm:w-auto"
            >
              💎 {t.seePremium}
            </HomeCtaLink>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-20 sm:px-8 sm:pb-24 md:grid-cols-3">
          {t.features.map((card) => (
            <article
              key={card.title}
              className="rounded-3xl border border-white/5 bg-[#1A1A1A] p-6 sm:p-8"
            >
              <h2 className="text-xl font-bold text-[#E8DCC8]">
                {card.title}
              </h2>

              <p className="mt-4 leading-7 text-[#A9A9A9]">{card.text}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
