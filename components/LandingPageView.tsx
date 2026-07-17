import Link from "next/link";
import Navbar from "@/components/Navbar";
import FootballBackground from "@/components/FootballBackground";
import HomeCtaLink from "@/components/HomeCtaLink";
import type { LandingPageContent } from "@/lib/landingPages";

export default function LandingPageView({
  content,
}: {
  content: LandingPageContent;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-[#FAFAF8]">
      <FootballBackground />

      <div className="relative z-10">
        <Navbar />

        <section className="mx-auto max-w-4xl px-4 py-12 text-center sm:px-8 sm:py-24">
          <p className="inline-flex rounded-full border border-[#18ff6d33] bg-[#18ff6d]/10 px-4 py-2 text-sm font-semibold text-[#18ff6d]">
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
                <span className="text-[#18ff6d]">✓</span>
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
            className="mt-8 inline-block text-sm font-semibold text-[#18ff6d] hover:underline"
          >
            Analysis vs outcome →
          </Link>
        </section>
      </div>
    </main>
  );
}
