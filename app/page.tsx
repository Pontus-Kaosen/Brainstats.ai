import Navbar from "@/components/Navbar";
import FootballBackground from "@/components/FootballBackground";
import BrainStatsLogo from "@/components/BrainStatsLogo";
import HomeHeroCtas from "@/components/HomeHeroCtas";
import { getHomeContent } from "@/lib/homeContent";
import { detectLanguage } from "@/lib/locale.server";
import { createPageMetadata, getLocalizedPageSeo } from "@/lib/seo";

export async function generateMetadata() {
  const language = await detectLanguage();
  const seo = getLocalizedPageSeo("home", language);

  return createPageMetadata({
    title: seo.title,
    description: seo.description,
    path: seo.path,
    language,
  });
}

export default async function Home() {
  const language = await detectLanguage();
  const t = getHomeContent(language);

  return (
    <main className="relative min-h-screen overflow-x-hidden brain-page">
      <FootballBackground />

      <div className="relative z-10">
        <Navbar />

        <section className="mx-auto flex min-h-[calc(100vh-5.5rem)] max-w-3xl flex-col items-center justify-center px-6 py-16 text-center sm:px-8 sm:py-24">
          <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-[#E8DCC8]/70">
            {t.badge}
          </p>

          <BrainStatsLogo
            variant="hero"
            className="mt-10 opacity-95 sm:mt-12"
          />

          <h1 className="mt-10 max-w-xl text-4xl font-semibold tracking-tight text-[#FAFAF8] sm:mt-12 sm:text-6xl sm:leading-[1.08]">
            {t.title}
          </h1>

          <p className="mt-6 max-w-md text-sm leading-7 text-[#9A9A9A] sm:mt-8 sm:text-base sm:leading-8">
            {t.description}
          </p>

          <HomeHeroCtas />

          <p className="mt-10 text-[11px] tracking-[0.18em] text-[#6A6A6A] sm:mt-12">
            {t.trustStrip}
          </p>
        </section>
      </div>
    </main>
  );
}
