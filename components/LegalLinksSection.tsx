"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { legalSlugs } from "@/lib/legalSlugs";
import { getSellerBlock } from "@/lib/companyInfo";

type LegalLinksSectionProps = {
  compact?: boolean;
};

export default function LegalLinksSection({
  compact = false,
}: LegalLinksSectionProps) {
  const { t, language } = useLanguage();

  const links = legalSlugs.map((slug) => ({
    slug,
    href: `/legal/${slug}`,
    title: t.legal.links[slug],
    description: t.legal.descriptions[slug],
  }));

  if (compact) {
    return (
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm">
        <Link href="/legal" className="text-[#18ff6d] hover:underline">
          {t.footer.allLegal}
        </Link>
        {links.map((link) => (
          <Link
            key={link.slug}
            href={link.href}
            className="text-[#A9A9A9] transition hover:text-[#18ff6d]"
          >
            {link.title}
          </Link>
        ))}
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-8 sm:pb-20">
      <div className="rounded-[2rem] border border-[#18ff6d22] bg-black/35 p-6 sm:p-10">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#18ff6d]">
          {t.home.legalEyebrow}
        </p>

        <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">
          {t.home.legalTitle}
        </h2>

        <p className="mt-4 max-w-3xl leading-8 text-[#A9A9A9]">
          {t.home.legalDescription}
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => (
            <Link
              key={link.slug}
              href={link.href}
              className="rounded-2xl border border-white/10 bg-[#101010]/80 p-5 transition hover:border-[#18ff6d44] hover:bg-[#18ff6d]/5"
            >
              <h3 className="font-bold text-[#E8DCC8]">{link.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#888]">
                {link.description}
              </p>
            </Link>
          ))}

          <Link
            href="/legal"
            className="rounded-2xl border border-[#18ff6d33] bg-[#18ff6d]/10 p-5 transition hover:bg-[#18ff6d]/15"
          >
            <h3 className="font-bold text-[#18ff6d]">{t.footer.allLegal}</h3>
            <p className="mt-2 text-sm leading-6 text-[#A9A9A9]">
              {t.legal.hubDescription}
            </p>
          </Link>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-black/40 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#777]">
            {t.home.legalSellerLabel}
          </p>
          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#C8C8C8]">
            {getSellerBlock(language)}
          </p>
        </div>
      </div>
    </section>
  );
}
