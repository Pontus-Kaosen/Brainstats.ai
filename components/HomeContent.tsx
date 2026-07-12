"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Button from "@/components/Button";
import FootballBackground from "@/components/FootballBackground";
import { useLanguage } from "@/components/LanguageProvider";

export default function HomeContent() {
  const { t } = useLanguage();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-[#FAFAF8]">
      <FootballBackground />

      <div className="relative z-10">
        <Navbar />

        <section className="mx-auto flex max-w-7xl flex-col items-center px-8 py-32 text-center">
          <span className="rounded-full border border-[#E8DCC8]/20 px-5 py-2 text-sm text-[#E8DCC8]">
            {t.home.badge}
          </span>

          <h2 className="mt-8 max-w-5xl text-6xl font-bold leading-tight">
            {t.home.title}
          </h2>

          <p className="mt-8 max-w-2xl text-lg text-[#A9A9A9]">
            {t.home.description}
          </p>

          <div className="mt-12 flex flex-wrap justify-center gap-5">
            <Link href="/analyze">
              <Button>{t.home.pasteBet}</Button>
            </Link>

            <Link href="/builder">
              <Button variant="secondary">{t.home.buildBet}</Button>
            </Link>

            <Link href="/premium">
              <Button variant="secondary">{t.home.seePremium}</Button>
            </Link>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-6 px-8 pb-24 md:grid-cols-3">
          {t.home.features.map((feature) => (
            <div key={feature.title} className="rounded-3xl bg-[#1A1A1A] p-8">
              <h3 className="text-xl font-bold text-[#E8DCC8]">
                {feature.title}
              </h3>
              <p className="mt-4 text-[#A9A9A9]">{feature.text}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
