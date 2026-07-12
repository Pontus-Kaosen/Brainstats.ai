"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import FootballBackground from "@/components/FootballBackground";
import { useLanguage } from "@/components/LanguageProvider";
import { legalSlugs } from "@/lib/legalSlugs";
import { getSellerBlock } from "@/lib/companyInfo";

export default function LegalHubPage() {
  const { t, language } = useLanguage();

  const cards = legalSlugs.map((slug) => ({
    slug,
    title: t.legal.links[slug],
    description: t.legal.descriptions[slug],
    href: `/legal/${slug}`,
  }));

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-[#FAFAF8]">
      <FootballBackground />

      <div className="relative z-10 flex min-h-screen flex-col">
        <Navbar />

        <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-8 sm:py-14">
          <p className="text-sm uppercase tracking-[0.3em] text-[#18ff6d]">
            BrainStats Legal
          </p>

          <h1 className="mt-4 text-4xl font-black sm:text-5xl">
            {t.legal.hubTitle}
          </h1>

          <p className="mt-4 max-w-2xl text-lg leading-8 text-[#A9A9A9]">
            {t.legal.hubDescription}
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {cards.map((card) => (
              <Link
                key={card.slug}
                href={card.href}
                className="rounded-3xl border border-[#18ff6d22] bg-black/35 p-6 transition hover:-translate-y-1 hover:border-[#18ff6d55] hover:bg-[#18ff6d]/5"
              >
                <h2 className="text-xl font-bold text-[#E8DCC8]">
                  {card.title}
                </h2>

                <p className="mt-3 leading-7 text-[#A9A9A9]">
                  {card.description}
                </p>
              </Link>
            ))}
          </div>

          <div className="mt-10 rounded-3xl border border-white/10 bg-black/35 p-6 sm:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#18ff6d]">
              {t.home.legalSellerLabel}
            </p>
            <p className="mt-4 whitespace-pre-line leading-7 text-[#C8C8C8]">
              {getSellerBlock(language)}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
