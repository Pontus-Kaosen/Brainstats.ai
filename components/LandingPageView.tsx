"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import FootballBackground from "@/components/FootballBackground";
import HomeCtaLink from "@/components/HomeCtaLink";
import { useLanguage } from "@/components/LanguageProvider";
import type { LandingPageContent } from "@/lib/landingPages";

const accentStyles = {
  green: {
    badge: "border-[#18ff6d33] bg-[#18ff6d]/10 text-[#18ff6d]",
    check: "text-[#18ff6d]",
    link: "text-[#18ff6d]",
  },
  blue: {
    badge: "border-[#72d5ff33] bg-[#2fbfff]/10 text-[#72d5ff]",
    check: "text-[#72d5ff]",
    link: "text-[#72d5ff]",
  },
  gold: {
    badge: "border-[#E8DCC833] bg-[#E8DCC8]/10 text-[#E8DCC8]",
    check: "text-[#E8DCC8]",
    link: "text-[#E8DCC8]",
  },
} as const;

export default function LandingPageView({
  content,
}: {
  content: LandingPageContent;
}) {
  const { t } = useLanguage();
  const accent = accentStyles[content.accent ?? "green"];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-[#FAFAF8]">
      <FootballBackground />

      <div className="relative z-10">
        <Navbar />

        <section className="mx-auto max-w-4xl px-4 py-12 text-center sm:px-8 sm:py-24">
          <p
            className={`inline-flex rounded-full border px-4 py-2 text-sm font-semibold ${accent.badge}`}
          >
            {content.badge}
          </p>

          <h1 className="mt-6 text-3xl font-black leading-tight sm:text-5xl">
            {content.title}
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#A9A9A9]">
            {content.description}
          </p>

          <ul className="mx-auto mt-8 max-w-xl space-y-3 text-left text-sm text-[#D8D8D8]">
            {content.bullets.map((bullet) => (
              <li key={bullet} className="flex gap-3">
                <span className={accent.check}>✓</span>
                {bullet}
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
            <HomeCtaLink href={content.primaryCta.href}>
              {content.primaryCta.label}
            </HomeCtaLink>
            <HomeCtaLink href={content.secondaryCta.href} variant="secondary">
              {content.secondaryCta.label}
            </HomeCtaLink>
          </div>

          <Link
            href="/track-record"
            className={`mt-8 inline-block text-sm font-semibold hover:underline ${accent.link}`}
          >
            {t.landing.trackRecordLink} →
          </Link>
        </section>
      </div>
    </main>
  );
}
