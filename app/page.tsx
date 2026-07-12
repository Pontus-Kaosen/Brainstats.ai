"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Button from "@/components/Button";
import FootballBackground from "@/components/FootballBackground";
import { useLanguage } from "@/components/LanguageProvider";

export default function Home() {
  const { t } = useLanguage();

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#050505] text-[#FAFAF8]">
      <FootballBackground />

      <div className="relative z-10">
        <Navbar />

        <section className="mx-auto flex max-w-7xl flex-col items-center px-4 py-20 text-center sm:px-8 sm:py-32">
          <span className="rounded-full border border-[#E8DCC8]/20 px-5 py-2 text-sm text-[#E8DCC8]">
            🧠 {t.home.badge}
          </span>

          <h2 className="mt-8 max-w-5xl text-4xl font-bold leading-tight sm:text-6xl">
            {t.home.title}
          </h2>

          <p className="mt-8 max-w-2xl text-base leading-8 text-[#A9A9A9] sm:text-lg">
            {t.home.description}
          </p>

          <div className="mt-12 flex w-full flex-col justify-center gap-4 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-5">
            <Link href="/analyze" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto">
                📝 {t.home.pasteBet}
              </Button>
            </Link>

            <Link href="/builder" className="w-full sm:w-auto">
              <Button
                variant="secondary"
                className="w-full sm:w-auto"
              >
                ⚽ {t.home.buildBet}
              </Button>
            </Link>

            <Link href="/premium" className="w-full sm:w-auto">
              <Button
                variant="secondary"
                className="w-full sm:w-auto"
              >
                💎 {t.home.seePremium}
              </Button>
            </Link>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-20 sm:px-8 sm:pb-24 md:grid-cols-3">
          {t.home.features.map((card) => (
            <div
              key={card.title}
              className="rounded-3xl border border-white/5 bg-[#1A1A1A] p-6 sm:p-8"
            >
              <h3 className="text-xl font-bold text-[#E8DCC8]">
                {card.title}
              </h3>

              <p className="mt-4 leading-7 text-[#A9A9A9]">
                {card.text}
              </p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}